# 🤖 VisuWallet WhatsApp Bot

Bot de WhatsApp para registrar gastos e ingresos usando lenguaje natural.

## 🚀 Características

- ✅ Procesamiento de lenguaje natural (Gemini AI + Reglas)
- 💬 Conversación interactiva para selección de cuentas
- 🔄 Sincronización en tiempo real con Firebase
- 📊 Detección automática de categorías
- 🌍 Soporte para formato internacional de teléfonos (593...)

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Meta for Developers (WhatsApp Business API)
- Cuenta de Google Cloud (Gemini AI)
- Firebase Admin SDK configurado

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Configurar Firebase Admin SDK:**
   - Seguir instrucciones en `FIREBASE_SETUP.md`
   - Descargar `firebase-admin-key.json` y colocarlo en la raíz del bot

4. **Probar conexión con Firestore:**
```bash
node test-firestore.js
```

5. **Iniciar el servidor:**
```bash
node index.js
```

## 📁 Estructura del Proyecto

```
visuwallet-whatsapp-bot/
├── index.js                    # Servidor Express + Webhooks
├── parser/
│   └── parser.js              # Parser híbrido (Reglas + Gemini AI)
├── db/
│   ├── FirestoreProvider.js   # Integración con Firebase
│   └── db.js                  # Provider local (deprecated)
├── .env.example               # Plantilla de variables de entorno
├── firebase-admin-key.json    # Credenciales Firebase (NO subir a Git)
└── test-firestore.js          # Script de pruebas
```

## 🔐 Seguridad

**⚠️ NUNCA subas estos archivos a Git:**
- `.env` - Variables de entorno
- `firebase-admin-key.json` - Credenciales de Firebase
- `node_modules/` - Dependencias

Estos archivos ya están en `.gitignore`.

## 📖 Uso

### Desde WhatsApp:

```
Usuario: "gasté 15 en pizza"
Bot: ¿A qué cuenta deseas guardar este gasto?
     1. Cuenta Produbanco (corriente)
     2. Cuenta Pichincha (ahorros)
     0. Cancelar

Usuario: "1"
Bot: ✅ Registrado en "Cuenta Produbanco"
     comida - $15.00
```

### Ejemplos de mensajes válidos:

- `"gasté 5 en sushi"`
- `"pagué 20 del taxi"`
- `"compré 10 de medicina"`
- `"me pagaron el sueldo"`

## 🛠️ Tecnologías

- **Node.js + Express** - Servidor web
- **Firebase Admin SDK** - Base de datos
- **Gemini AI (Google)** - Procesamiento de lenguaje natural
- **Meta Cloud API** - Integración con WhatsApp
- **Axios** - HTTP client

## 📊 Parser Híbrido

El bot usa una estrategia dual:

1. **Reglas manuales** (rápido, gratis):
   - Detecta patrones simples con RegEx
   - Palabras clave predefinidas
   - Confianza >= 0.8 → Usa este método

2. **Gemini AI** (inteligente, flexible):
   - Entiende lenguaje natural complejo
   - Se usa cuando las reglas fallan
   - Modelo: `gemini-flash-latest`

## 🧪 Testing

```bash
# Probar conexión con Firebase
node test-firestore.js

# Probar parser (sin servidor)
node -e "const {parseTransaccion} = require('./parser/parser'); parseTransaccion('gasté 5 en pizza').then(console.log)"
```

## 🚀 Deployment

### Opción 1: Render.com (Recomendado)
1. Conectar repositorio
2. Agregar variables de entorno
3. Deploy automático

### Opción 2: Railway.app
Similar a Render, también gratis.

### Opción 3: Ngrok (Solo testing)
```bash
ngrok http 3000
# Usar URL pública para webhook
```

## 🔄 Integración con la App

El bot comparte la misma base de datos Firestore con la app móvil:

- **Usuarios:** `usuarios/{uid}`
- **Cuentas:** `usuarios/{uid}/cuentas/{id}`
- **Transacciones:** `transacciones/{id}` (colección raíz)

Cuando el bot crea una transacción, aparece automáticamente en la app móvil.

## 📝 Licencia

ISC

## 👥 Autor

Proyecto VisuWallet
