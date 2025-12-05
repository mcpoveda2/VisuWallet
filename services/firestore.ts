import { db, ensureAnonymousSignIn } from 'utils/firebase.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

export type FirestoreTransaction = {
  tipo: 'income' | 'expense' | 'transfer';
  categoria: string;
  monto: number;
  fecha: string; // stored as string per current UI
  descripcion?: string;
  cuentaCodigo?: string; // account code (numero) to link transaction to user's account
  account?: string; // display account string from UI
  labels?: string[];
  payee?: string;
  createdAt?: any;
  createdByUid?: string;
  ownerUid?: string;
};

export type FirestoreUser = {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  providerId?: string;
};

export type FirestoreCuenta = {
  tipo?: string;
  numero?: string;
  saldo?: number;
  cedula?: string;
  propietario?: string; // or titular
  email?: string;
  ownerUid?: string;
};

// Add a transaction to 'transacciones' with audit fields
export async function addTransaction(tx: FirestoreTransaction & { cuentaId?: string }) {
  const user = await ensureAnonymousSignIn();
  const ownerUid = user?.uid ?? undefined;
  const payload = {
    ...tx,
    ownerUid,
    createdByUid: ownerUid,
    createdAt: serverTimestamp(),
  } as any;

  // Add strong references for ease of navigation from app
  if (ownerUid) {
    payload.refUsuario = doc(db, 'usuarios', ownerUid);
  }
  if (ownerUid && tx.cuentaId) {
    payload.refCuenta = doc(db, 'usuarios', ownerUid, 'cuentas', tx.cuentaId);
  }

  const ref = await addDoc(collection(db, 'transacciones'), payload);
  return ref.id;
}

// Fetch all transactions (simple one-shot)
export async function listTransactions(): Promise<(FirestoreTransaction & { id: string })[]> {
  const snap = await getDocs(collection(db, 'transacciones'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

// Subscribe to transactions in real time
export function onTransactions(cb: (items: (FirestoreTransaction & { id: string })[]) => void) {
  const q = query(collection(db, 'transacciones'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(items);
  });
}

// Upsert user document in 'usuarios/{uid}'
export async function upsertUserDoc(uid: string, data: FirestoreUser) {
  const ref = doc(db, 'usuarios', uid);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
}

export async function getUser(uid: string): Promise<FirestoreUser | null> {
  const ref = doc(db, 'usuarios', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as any) : null;
}

// Convenience upsert accepting FirestoreUser shape with uid included
export async function upsertUser(user: FirestoreUser) {
  const ref = doc(db, 'usuarios', user.uid);
  await setDoc(ref, { ...user, updatedAt: serverTimestamp() }, { merge: true });
}

// List 'cuentas' collection
export async function listCuentas(ownerUid?: string): Promise<({ id: string } & FirestoreCuenta)[]> {
  if (!ownerUid) {
    const u = await ensureAnonymousSignIn();
    ownerUid = u?.uid;
  }
  const base = collection(db, 'usuarios', ownerUid as string, 'cuentas');
  const snap = await getDocs(base);
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  // normalize saldo to number
  return items.map((c) => ({
    ...c,
    saldo: c.saldo != null ? Number(c.saldo) : 0,
    propietario: c.propietario ?? c.titular ?? '',
    tipo: c.tipo ?? 'corriente',
    numero: c.numero ?? '',
  }));
}

// Subscribe to cuentas changes
export function onCuentas(cb: (items: ({ id: string } & FirestoreCuenta)[]) => void, ownerUid?: string) {
  const base = collection(db, 'usuarios', (ownerUid || 'unknown') as string, 'cuentas');
  return onSnapshot(base, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(items.map((c) => ({
      ...c,
      saldo: c.saldo != null ? Number(c.saldo) : 0,
      propietario: c.propietario ?? c.titular ?? '',
      tipo: c.tipo ?? 'corriente',
      numero: c.numero ?? '',
    })));
  });
}

// Create a cuenta inside user's embedded subcollection `usuarios/{uid}/cuentas`
export async function addCuenta(data: FirestoreCuenta, ownerUid?: string) {
  let uid = ownerUid;
  if (!uid) {
    const u = await ensureAnonymousSignIn();
    uid = u?.uid;
  }
  if (!uid) throw new Error('No authenticated user');
  const base = collection(db, 'usuarios', uid as string, 'cuentas');
  const payload: any = {
    ...data,
    ownerUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  // Firestore does not accept undefined; ensure optional fields are null or removed
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) {
      delete payload[k];
    }
  });
  if (payload.email === undefined) payload.email = null;
  const ref = await addDoc(base, payload);
  return ref.id;
}
