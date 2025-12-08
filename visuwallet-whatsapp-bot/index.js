const express = require('express'); // carga express, que sirve para crear el servidor y manejar rutas http
const bodyParser = require('body-parser'); // sirve para leer el req.body 
const axios = require('axios'); // enviar peticiones HTTP desde el backend a la API de wsp
require('dotenv').config(); // cargar las variables del archivo .env
const path = require('path');
const { LocalJSONProvider } = require('./db/db');
const { FirestoreProvider } = require('./db/FirestoreProvider');
// IMPORTAR NUESTRO NUEVO PARSER
const { parseTransaccion } = require('./parser/parser');

// 1. Leemos variables de entorno
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// Usar FirestoreProvider en lugar de LocalJSONProvider
const dbProvider = new FirestoreProvider();


// 2. Creamos la app de Express
const app = express();
// Clave: numero de whatsapp (from), valor: { tx, accounts, ownerUid }
const pendingByPhone = {};


// 3. Middleware para leer JSON en el body
app.use(bodyParser.json());

/**
 * GET /webhook
 * Meta llama aquí solo una vez para verificar que el servidor es tuyo.
 * Envía: hub.mode, hub.verify_token, hub.challenge
 * Si el verify_token coincide, le devolvemos el challenge.
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('GET /webhook recibido', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado correctamente');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Falló la verificación del webhook');
    return res.sendStatus(403);
  }
});

/**
 * POST /webhook
 * Aquí llegan los mensajes reales de WhatsApp.
 * Meta envía un JSON con la estructura:
 * { entry: [ { changes: [ { value: { messages: [...] } } ] } ] }
 */
app.post('/webhook', async (req, res) => {
  // console.log para depuración...
  
  const entry = req.body.entry && req.body.entry[0];
  const changes = entry && entry.changes && entry.changes[0];
  const value = changes && changes.value;
  const messages = value && value.messages;

  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = msg.from;
    const text = msg.text?.body || '';

    console.log('👉 Mensaje:', text);

    try {
      // VERIFICAR SI HAY UNA TRANSACCIÓN PENDIENTE
      if (pendingByPhone[from]) {
        // El usuario está respondiendo a la pregunta de cuenta
        await handleAccountSelection(from, text);
      } else {
        // 1) USAR EL NUEVO PARSER HÍBRIDO
        const transaccion = await parseTransaccion(text);
        console.log('📝 Interpretación:', transaccion);

        // VALIDACIÓN: Verificar si el mensaje tiene sentido como transacción
        if (transaccion.monto === 0 || transaccion.confidence < 0.3) {
          console.log('⚠️ Mensaje rechazado: no parece una transacción válida');
          await sendWhatsAppMessage(
            from,
            '🤔 No entendí tu mensaje. Para registrar un gasto, escribe algo como:\n\n"gasté 5 en pizza"\n"pagué 20 de taxi"\n"compré 10 de medicina"'
          );
          return;
        }

        // 2) Buscar usuario por número de WhatsApp
        const user = await dbProvider.findUserByPhone(from);
        
        if (!user) {
          await sendWhatsAppMessage(
            from,
            '❌ Usuario no registrado.\n\n' +
            'Por favor, regístrate primero en la app VisuWallet para poder usar el bot de WhatsApp.\n\n' +
            '📱 Descarga la app y crea tu cuenta con este número: ' + from
          );
          return;
        }

        // 3) Obtener cuentas del usuario desde Firestore
        const accounts = await dbProvider.getUserAccounts(user.uid);

        if (accounts.length === 0) {
          await sendWhatsAppMessage(
            from,
            '❌ No tienes cuentas registradas.\n\n' +
            'Por favor crea al menos una cuenta en la app VisuWallet antes de registrar transacciones.'
          );
          return;
        }

        // 4) Guardar transacción pendiente
        pendingByPhone[from] = {
          tx: transaccion,
          accounts: accounts,
          ownerUid: user.uid
        };

        // 5) Preguntar a qué cuenta guardar
        let mensaje = `📝 Gasto detectado: ${transaccion.categoria} - $${transaccion.monto}\n\n`;
        mensaje += '¿A qué cuenta deseas guardar este gasto?\n\n';
        
        accounts.forEach((acc, idx) => {
          mensaje += `${idx + 1}. ${acc.nombre} (${acc.tipo})\n`;
        });
        
        mensaje += '\n0. ❌ Cancelar / No guardar';
        mensaje += '\n\nResponde con el número de la cuenta.';
        
        await sendWhatsAppMessage(from, mensaje);
      }

    } catch (err) {
      console.error("Error procesando mensaje:", err);
      await sendWhatsAppMessage(
        from,
        '❌ Hubo un error procesando tu mensaje. Intenta de nuevo.'
      );
    }
  }

  res.sendStatus(200);
  
});

/**
 * Función para enviar un mensaje de texto por WhatsApp usando la Cloud API.
 */
async function sendWhatsAppMessage(to, body) {
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Mensaje enviado a WhatsApp:');
    console.log(response.data);
  } catch (error) {
    console.error('❌ Error al enviar mensaje a WhatsApp:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
  
}

/**
 * Maneja la selección de cuenta cuando el usuario responde con un número
 */
async function handleAccountSelection(from, text) {
  const pending = pendingByPhone[from];
  
  if (!pending) {
    await sendWhatsAppMessage(from, '❌ No hay ninguna transacción pendiente.');
    return;
  }

  // Intentar parsear el número de cuenta
  const opcion = parseInt(text.trim());
  
  if (isNaN(opcion) || opcion < 0 || opcion > pending.accounts.length) {
    await sendWhatsAppMessage(
      from,
      `❌ Opción inválida. Por favor responde con un número del 0 al ${pending.accounts.length}.\n\n0 = Cancelar`
    );
    return;
  }

  // Manejar cancelación
  if (opcion === 0) {
    delete pendingByPhone[from];
    await sendWhatsAppMessage(
      from,
      '🚫 Transacción cancelada. No se guardó nada.'
    );
    return;
  }

  // Seleccionar la cuenta
  const cuentaSeleccionada = pending.accounts[opcion - 1];
  
  // Completar la transacción con el accountId
  const transaccionCompleta = {
    ...pending.tx,
    accountId: cuentaSeleccionada.id,
    ownerUid: pending.ownerUid
  };

  // Guardar la transacción en Firestore
  const guardada = await dbProvider.saveTransaction(
    pending.ownerUid,
    cuentaSeleccionada.id,
    transaccionCompleta
  );

  // Responder al usuario
  await sendWhatsAppMessage(
    from,
    `✅ Registrado en "${cuentaSeleccionada.nombre}":\n` +
    `${guardada.categoria} - $${guardada.monto}\n` +
    `"${guardada.descripcion}"`
  );

  // Limpiar la transacción pendiente
  delete pendingByPhone[from];
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
