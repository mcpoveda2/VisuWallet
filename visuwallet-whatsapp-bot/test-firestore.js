/**
 * Script de prueba para verificar la conexión con Firestore
 * Uso: node test-firestore.js
 */

const { FirestoreProvider } = require('./db/FirestoreProvider');

async function testFirestore() {
  console.log('🧪 Iniciando pruebas de FirestoreProvider...\n');
  
  try {
    const provider = new FirestoreProvider();
    
    // TEST 1: Buscar usuario por teléfono (formato local)
    console.log('📞 TEST 1a: Buscar usuario por teléfono (formato local)');
    const testPhoneLocal = '0984297653'; // Del screenshot
    const user1 = await provider.findUserByPhone(testPhoneLocal);
    
    if (user1) {
      console.log('✅ Usuario encontrado con formato local:');
      console.log('   - UID:', user1.uid);
      console.log('   - Email:', user1.email);
      console.log('   - Phone:', user1.phone);
    } else {
      console.log('❌ Usuario no encontrado con teléfono local:', testPhoneLocal);
    }
    
    console.log('');
    
    // TEST 1b: Buscar usuario por teléfono (formato internacional)
    console.log('📞 TEST 1b: Buscar usuario por teléfono (formato internacional)');
    const testPhoneInternational = '593984297653'; // Formato WhatsApp
    const user2 = await provider.findUserByPhone(testPhoneInternational);
    
    if (user2) {
      console.log('✅ Usuario encontrado con formato internacional:');
      console.log('   - UID:', user2.uid);
      console.log('   - Email:', user2.email);
      console.log('   - Phone:', user2.phone);
      console.log('');
      
      // TEST 2: Obtener cuentas del usuario
      console.log('💳 TEST 2: Obtener cuentas del usuario');
      const accounts = await provider.getUserAccounts(user2.uid);
      
      if (accounts.length > 0) {
        console.log(`✅ Encontradas ${accounts.length} cuenta(s):`);
        accounts.forEach((acc, idx) => {
          console.log(`   ${idx + 1}. ${acc.nombre} (${acc.tipo}) - Balance: $${acc.balance}`);
        });
      } else {
        console.log('⚠️ No se encontraron cuentas para este usuario');
      }
      
    } else {
      console.log('❌ Usuario no encontrado con teléfono internacional:', testPhoneInternational);
      console.log('   Verifica que el número esté en la colección "usuarios"');
    }
    
    console.log('\n✅ Pruebas completadas exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:');
    console.error(error.message);
    console.error('\nVerifica:');
    console.error('1. Que el archivo firebase-admin-key.json existe');
    console.error('2. Que tienes acceso a internet');
    console.error('3. Que las credenciales son válidas');
    process.exit(1);
  }
}

testFirestore();
