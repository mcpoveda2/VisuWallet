# Configuración de Firebase Admin SDK

## 📋 Pasos para obtener las credenciales

### 1. Ir a Firebase Console

- Abre https://console.firebase.google.com/
- Selecciona tu proyecto **VisuWallet**

### 2. Ir a Configuración del Proyecto

- Haz clic en el ícono de ⚙️ (engranaje) junto a "Descripción general del proyecto"
- Selecciona **Configuración del proyecto**

### 3. Ir a la pestaña "Cuentas de servicio"

- En el menú superior, haz clic en **Cuentas de servicio**

### 4. Generar nueva clave privada

- Haz clic en el botón **Generar nueva clave privada**
- Se descargará un archivo JSON con un nombre como:
  ```
  visuwallet-xxxxx-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
  ```

### 5. Renombrar y mover el archivo

- Renombra el archivo descargado a: **`firebase-admin-key.json`**
- Mueve el archivo a la carpeta raíz del bot:
  ```
  visuwallet-whatsapp-bot/
    ├── firebase-admin-key.json  ← AQUÍ
    ├── index.js
    ├── package.json
    └── ...
  ```

### 6. Agregar al .gitignore

El archivo ya está en `.gitignore` para evitar subirlo a Git:

```gitignore
firebase-admin-key.json
*.json  # Credenciales privadas
```

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**

- **NUNCA** subas este archivo a GitHub
- **NUNCA** lo compartas públicamente
- Este archivo contiene las credenciales completas de tu proyecto Firebase

---

## ✅ Verificar instalación

Una vez que tengas el archivo `firebase-admin-key.json`, ejecuta:

```bash
node index.js
```

Deberías ver en la consola:

```
✅ FirestoreProvider inicializado correctamente
Servidor escuchando en http://localhost:3000
```

Si ves errores, verifica:

1. Que el archivo esté en la ubicación correcta
2. Que el archivo sea válido JSON
3. Que hayas instalado las dependencias: `npm install firebase-admin`
