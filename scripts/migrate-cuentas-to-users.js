// scripts/migrate-cuentas-to-users.js
// Migrate top-level 'cuentas' documents into users/{ownerUid}.cuentas embedded array.
// WARNING: Run on a backup or emulator first.

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON before running this script.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function migrate() {
  const snap = await db.collection('cuentas').get();
  console.log('Found', snap.size, 'cuentas');

  for (const d of snap.docs) {
    const data = d.data();
    const owner = data.ownerUid || data.propietarioUid || data.userId || null;
    if (!owner) {
      console.warn('Skipping cuenta without owner info:', d.id);
      continue;
    }

    const userRef = db.collection('users').doc(owner);
    await db.runTransaction(async (t) => {
      const uSnap = await t.get(userRef);
      const cuentas = (uSnap.exists && uSnap.data().cuentas) ? uSnap.data().cuentas : [];
      const cuentasIds = (uSnap.exists && uSnap.data().cuentasIds) ? uSnap.data().cuentasIds : [];

      const cuentaObj = {
        id: d.id,
        nombre: data.nombre || data.propietario || `Cuenta ${d.id}`,
        balance: Number(data.saldo ?? data.balance ?? 0),
        tipo: data.tipo || '',
        numero: data.numero || '',
        createdAt: data.createdAt || new Date().toISOString(),
      };

      cuentas.push(cuentaObj);
      cuentasIds.push(d.id);

      t.set(userRef, { cuentas, cuentasIds }, { merge: true });
    });

    console.log('Migrated cuenta', d.id, 'to user', owner);
  }

  console.log('Migration complete');
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
