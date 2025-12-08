import { getAuth } from 'firebase/auth';
import { db } from 'utils/firebase.js';
import {
  doc,
  getDoc,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Types are informal here; project has `types/index.ts` for Cuenta/Transaccion

export async function getCuentasFromUserDoc() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data: any = snap.data();
  return data.cuentas ?? [];
}

export async function createCuentaEmbedded(payload: { nombre: string; balance?: number; tipo?: string; numero?: string }) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const userRef = doc(db, 'users', user.uid);
  return runTransaction(db, async (t) => {
    const snap = await t.get(userRef);
    const existing = snap.exists() ? (snap.data() as any) : {};
    const cuentas = existing.cuentas ? [...existing.cuentas] : [];
    const cuentasIds = existing.cuentasIds ? [...existing.cuentasIds] : [];

    const id = uuidv4();
    const cuenta = {
      id,
      nombre: payload.nombre,
      balance: Number(payload.balance ?? 0),
      tipo: payload.tipo ?? 'corriente',
      numero: payload.numero ?? '',
      createdAt: new Date().toISOString(),
    } as any;

    cuentas.push(cuenta);
    cuentasIds.push(id);

    if (!snap.exists()) {
      t.set(userRef, { cuentas, cuentasIds });
    } else {
      t.update(userRef, { cuentas, cuentasIds });
    }

    return cuenta;
  });
}

// Add transaction to top-level collection `transacciones` and to legacy `registro` for compatibility.
export async function addTransaccionAndUpdateBalance(cuentaId: string, tx: { tipo: string; monto: number; categoria?: string; fecha?: string; descripcion?: string; }) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const userRef = doc(db, 'users', user.uid);
  const transCol = collection(db, 'transacciones');

  return runTransaction(db, async (t) => {
    const userSnap = await t.get(userRef);
    if (!userSnap.exists()) throw new Error('Usuario no encontrado');
    const userData: any = userSnap.data();
    const cuentas: any[] = userData.cuentas ?? [];
    const idx = cuentas.findIndex((c) => c.id === cuentaId);
    if (idx === -1) throw new Error('Cuenta no encontrada o no es del usuario');

    const isIncome = tx.tipo === 'income';
    const current = Number(cuentas[idx].balance || 0);
    const newBalance = current + (isIncome ? Number(tx.monto) : -Number(tx.monto));

    const txDoc = {
      cuentaId,
      ownerUid: user.uid,
      createdByUid: user.uid,
      tipo: tx.tipo,
      categoria: tx.categoria ?? '',
      monto: Number(tx.monto),
      fecha: tx.fecha ?? new Date().toISOString(),
      descripcion: tx.descripcion ?? '',
      createdAt: serverTimestamp(),
    } as any;

    // write new transaction (outside transaction since addDoc isn't supported in runTransaction)
    // we write only to the top-level `transacciones` collection. Legacy `registro` writes were removed
    // to avoid duplicate records. Consumers should read from `transacciones` (ordered by createdAt).
    const addedRef = await addDoc(transCol, txDoc);

    // update embedded account balance
    const updatedCuenta = { ...cuentas[idx], balance: newBalance };
    const updatedCuentas = [...cuentas];
    updatedCuentas[idx] = updatedCuenta;
    t.update(userRef, { cuentas: updatedCuentas });

    return { transId: addedRef.id, newBalance };
  });
}

export async function getRecentTransactionsForUser(uid: string, pageSize = 50) {
  // Order by server `createdAt` timestamp for consistent ordering regardless of client `fecha` format
  // Prefer server `createdAt` ordering; if ordering fails (mixed types in DB), fallback to client-side sort.
  try {
    const q = query(collection(db, 'transacciones'), where('ownerUid', '==', uid), orderBy('createdAt', 'desc'), limit(pageSize));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data() as any;

      // Normalize createdAt (server Timestamp) to ISO string for easier rendering in UI
      let createdAtIso: string | null = null;
      if (raw.createdAt && typeof (raw.createdAt as any).toDate === 'function') {
        createdAtIso = (raw.createdAt as any).toDate().toISOString();
      } else if (raw.createdAt && typeof raw.createdAt === 'string') {
        createdAtIso = raw.createdAt;
      }

      // Provide a `fecha` field for UI convenience: prefer explicit fecha/date, fallback to createdAtIso
      const fecha = raw.fecha ?? raw.date ?? createdAtIso ?? null;

      return {
        id: d.id,
        tipo: raw.tipo ?? raw.type ?? 'expense',
        categoria: raw.categoria ?? raw.category ?? '',
        monto: Number(raw.monto ?? raw.amount ?? 0),
        fecha,
        createdAt: createdAtIso,
        account: raw.account ?? raw.cuenta ?? '',
        accountId: raw.cuentaId ?? raw.accountId ?? '',
        ownerUid: raw.ownerUid ?? null,
        createdByUid: raw.createdByUid ?? null,
      } as any;
    });
  } catch (err) {
    // Fallback: query without ordering and sort in JS using fecha/createdAt
    console.warn('Ordering by createdAt failed, falling back to client-side sort:', err);
    const q = query(collection(db, 'transacciones'), where('ownerUid', '==', uid), limit(pageSize * 3));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const raw = d.data() as any;
      let createdAtIso: string | null = null;
      if (raw.createdAt && typeof (raw.createdAt as any).toDate === 'function') {
        createdAtIso = (raw.createdAt as any).toDate().toISOString();
      } else if (raw.createdAt && typeof raw.createdAt === 'string') {
        createdAtIso = raw.createdAt;
      }
      const fecha = raw.fecha ?? raw.date ?? createdAtIso ?? null;
      return {
        id: d.id,
        tipo: raw.tipo ?? raw.type ?? 'expense',
        categoria: raw.categoria ?? raw.category ?? '',
        monto: Number(raw.monto ?? raw.amount ?? 0),
        fecha,
        createdAt: createdAtIso,
        account: raw.account ?? raw.cuenta ?? '',
        accountId: raw.cuentaId ?? raw.accountId ?? '',
        ownerUid: raw.ownerUid ?? null,
        createdByUid: raw.createdByUid ?? null,
      } as any;
    });

    // sort by fecha/createdAt descending (newest first)
    items.sort((a: any, b: any) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : (a.fecha ? Date.parse(a.fecha) : 0);
      const tb = b.createdAt ? Date.parse(b.createdAt) : (b.fecha ? Date.parse(b.fecha) : 0);
      return tb - ta;
    });

    return items.slice(0, pageSize);
  }
}
