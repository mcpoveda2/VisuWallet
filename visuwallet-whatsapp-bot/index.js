const express = require('express'); // carga express, que sirve para crear el servidor y manejar rutas http
const bodyParser = require('body-parser'); // sirve para leer el req.body 
const axios = require('axios'); // enviar peticiones HTTP desde el backend a la API de wsp
require('dotenv').config(); // cargar las variables del archivo .env
const path = require('path');
const { LocalJSONProvider } = require('./db/db');
// IMPORTAR NUESTRO NUEVO PARSER
const { parseTransaccion } = require('./parser/parser');

// 1. Leemos variables de entorno
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

const dbProvider = new LocalJSONProvider(
  path.join(__dirname, 'data', 'transactions.json')
);


// 2. Creamos la app de Express
const app = express();

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
      // 1) USAR EL NUEVO PARSER HÍBRIDO
      // Notar el await, porque puede que llame a Gemini
      const transaccion = await parseTransaccion(text);
      console.log('📝 Interpretación:', transaccion);

      // 2) Guardar
      const guardada = await dbProvider.saveTransaction(transaccion);

      // 3) Responder
      // Personalizamos el mensaje según si fue IA o Reglas
      const icon = transaccion.origen === 'gemini' ? '🤖' : '⚡';
      await sendWhatsAppMessage(
        from,
        `✅ ${icon} Registrado: ${guardada.categoria} $${guardada.monto}\n"${guardada.descripcion}"`
      );

    } catch (err) {
      console.error("Error procesando mensaje:", err);
      // Opcional: Avisar al usuario que hubo un error
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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
