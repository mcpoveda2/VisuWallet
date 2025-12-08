const admin = require('firebase-admin');
const path = require('path');

/**
 * FirestoreProvider - Integración con Firebase para el Bot de WhatsApp
 * 
 * Estructura de la DB:
 * - Colección raíz: usuarios (con campo phone: "09...")
 * - Subcolección: users/{uid}/cuentas[] (array embebido)
 * - Colección raíz: transacciones (con ownerUid, refUsuario, cuentaId)
 */
class FirestoreProvider {
  constructor() {
    try {
      // Inicializar Firebase Admin SDK
      const serviceAccount = require('../firebase-admin-key.json');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      
      this.db = admin.firestore();
      console.log('✅ FirestoreProvider inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando FirestoreProvider:', error.message);
      throw error;
    }
  }

  /**
   * Busca un usuario por número de teléfono
   * @param {string} phoneNumber - Número en formato internacional "593..." o local "09..."
   * @returns {Promise<{uid: string, phone: string, email: string} | null>}
   */
  async findUserByPhone(phoneNumber) {
    try {
      // Normalizar el número (quitar espacios, guiones, paréntesis)
      let normalizedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
      
      // Convertir formato internacional (593...) a formato local (09...)
      // Ecuador: 593 → 09
      if (normalizedPhone.startsWith('593')) {
        normalizedPhone = '0' + normalizedPhone.substring(3);
        console.log(`📱 Convertido de internacional a local: ${phoneNumber} → ${normalizedPhone}`);
      }
      
      console.log(`🔍 Buscando usuario con phone: ${normalizedPhone}`);
      
      const usersRef = this.db.collection('usuarios');
      const snapshot = await usersRef.where('phone', '==', normalizedPhone).limit(1).get();
      
      if (snapshot.empty) {
        console.log('❌ Usuario no encontrado en Firestore');
        return null;
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      // El UID correcto es el que está en el campo 'uid', no el ID del documento
      const actualUid = userData.uid;
      
      console.log(`✅ Usuario encontrado: ${actualUid}`);
      
      return {
        uid: actualUid,
        phone: userData.phone,
        email: userData.email,
        displayName: userData.displayName
      };
    } catch (error) {
      console.error('❌ Error buscando usuario por teléfono:', error);
      throw error;
    }
  }

  /**
   * Obtiene las cuentas de un usuario desde usuarios/{uid}/cuentas (subcolección)
   * @param {string} uid - UID del usuario
   * @returns {Promise<Array<{id: string, nombre: string, tipo: string, balance: number}>>}
   */
  async getUserAccounts(uid) {
    try {
      console.log(`🔍 Obteniendo cuentas del usuario: ${uid}`);
      
      // Leer de la subcolección usuarios/{uid}/cuentas
      const cuentasRef = this.db.collection('usuarios').doc(uid).collection('cuentas');
      const snapshot = await cuentasRef.get();
      
      if (snapshot.empty) {
        console.log(`⚠️ No se encontraron cuentas en usuarios/${uid}/cuentas`);
        return [];
      }
      
      const cuentas = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        cuentas.push({
          id: doc.id, // ID del documento
          nombre: data.numero || data.nombre || 'Cuenta sin nombre',
          tipo: data.tipo || 'otros',
          balance: data.saldo || 0 // En la DB es "saldo", no "balance"
        });
      });
      
      console.log(`✅ Encontradas ${cuentas.length} cuenta(s)`);
      
      return cuentas;
    } catch (error) {
      console.error('❌ Error obteniendo cuentas:', error);
      throw error;
    }
  }

  /**
   * Guarda una transacción y actualiza el balance de la cuenta
   * @param {string} uid - UID del usuario
   * @param {string} cuentaId - ID de la cuenta seleccionada
   * @param {Object} transaccion - Datos de la transacción
   * @returns {Promise<Object>} Transacción guardada
   */
  async saveTransaction(uid, cuentaId, transaccion) {
    try {
      console.log(`💾 Guardando transacción para usuario ${uid}, cuenta ${cuentaId}`);
      
      // 1. Crear la transacción en la colección raíz 'transacciones'
      const transaccionData = {
        monto: transaccion.monto,
        categoria: transaccion.categoria || 'otros',
        descripcion: transaccion.descripcion || '',
        fecha: new Date().toISOString(),
        tipo: transaccion.tipo || 'expense',
        ownerUid: uid,
        refUsuario: this.db.doc(`usuarios/${uid}`), // Referencia Firestore
        cuentaId: cuentaId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdByUid: uid,
        // Datos adicionales del parser
        origen: transaccion.origen || 'whatsapp',
        confidence: transaccion.confidence || 1
      };
      
      const transaccionRef = await this.db.collection('transacciones').add(transaccionData);
      
      console.log(`✅ Transacción guardada con ID: ${transaccionRef.id}`);
      
      // 2. Actualizar el balance de la cuenta embebida en users/{uid}
      await this.updateAccountBalance(uid, cuentaId, transaccion.monto, transaccion.tipo);
      
      // 3. Retornar la transacción guardada
      return {
        id: transaccionRef.id,
        ...transaccionData,
        createdAt: new Date().toISOString() // Convertir timestamp a string
      };
    } catch (error) {
      console.error('❌ Error guardando transacción:', error);
      throw error;
    }
  }

  /**
   * Actualiza el saldo de una cuenta en la subcolección
   * @param {string} uid - UID del usuario
   * @param {string} cuentaId - ID de la cuenta
   * @param {number} monto - Monto de la transacción
   * @param {string} tipo - "income" o "expense"
   */
  async updateAccountBalance(uid, cuentaId, monto, tipo) {
    try {
      const cuentaRef = this.db.collection('usuarios').doc(uid).collection('cuentas').doc(cuentaId);
      const cuentaDoc = await cuentaRef.get();
      
      if (!cuentaDoc.exists) {
        console.warn(`⚠️ Cuenta ${cuentaId} no encontrada en usuarios/${uid}/cuentas`);
        return;
      }
      
      const cuentaData = cuentaDoc.data();
      const saldoActual = cuentaData.saldo || 0;
      
      // Calcular nuevo saldo
      const nuevoSaldo = tipo === 'income' 
        ? saldoActual + monto 
        : saldoActual - monto;
      
      // Actualizar en Firestore
      await cuentaRef.update({ saldo: nuevoSaldo });
      
      console.log(`✅ Saldo actualizado: ${saldoActual} → ${nuevoSaldo}`);
    } catch (error) {
      console.error('❌ Error actualizando saldo:', error);
      // No lanzamos error aquí para no bloquear la transacción principal
    }
  }
}

module.exports = { FirestoreProvider };
