# Configuración de Firebase para Google Sign-In en Android

## Problema Resuelto

Se ha corregido el error "Custom URI scheme is not enabled for your Android client" configurando correctamente el esquema de URI de redirección para Android.

## Cambios Realizados

1. **app.json**: Se agregó el `scheme: "visuwallet"` para generar el URI de redirección correcto
2. **firebase/authService.ts**: Se configuró con los 3 client IDs (iOS, Android, Web) y Expo maneja automáticamente el redirectUri

## Solución: Habilitar Esquema Personalizado en Cliente Android

**IMPORTANTE**: Aunque Google no recomienda esquemas personalizados, para Expo con EAS Build en Android es necesario habilitarlo.

### Paso 1: Acceder a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto: **visuwallet** (ID: 410749935369)

### Paso 2: Configurar OAuth 2.0 - Cliente Android

1. Ve a **APIs & Services** > **Credentials**
2. Busca el cliente OAuth 2.0 para **Android**:
   - **Client ID**: `410749935369-0l4itskbs31pnnf998scpe694lr7mmhk.apps.googleusercontent.com`
3. Haz clic en el cliente para editarlo

### Paso 3: Habilitar Esquema de URI Personalizado

1. En la sección **Esquema de URI personalizado**, simplemente activa la opción:
   - ✅ **Habilitar el esquema de URI personalizado**
2. **No hay campo para ingresar el esquema** - Google lo detecta automáticamente basándose en:
   - El package name de tu app (`com.g5.visuwallet`)
   - El scheme configurado en `app.json` (`visuwallet`)
3. **Nota**: Google indica que esta configuración puede tardar entre 5 minutos y algunas horas en aplicarse

**¿Por qué esto es necesario?**
- Expo con EAS Build usa el esquema personalizado configurado en `app.json` para manejar la redirección OAuth
- Aunque Google no lo recomienda, es la única forma de hacer funcionar OAuth con Expo en builds de producción (APK)
- Google detecta automáticamente el esquema basándose en tu configuración, por eso no necesitas ingresarlo manualmente

### Paso 4: Guardar y Reconstruir

1. Guarda los cambios en Google Cloud Console
2. Reconstruye tu APK con EAS Build:
   ```bash
   eas build --platform android --profile production
   ```

## Verificación

Después de reconstruir el APK, el error "Custom URI scheme is not enabled" debería desaparecer y la autenticación con Google debería funcionar correctamente en Android.

## Notas Adicionales

- El scheme `visuwallet` se usa para generar el URI de redirección: `visuwallet://redirect`
- Este URI debe coincidir exactamente con el configurado en Google Cloud Console
- Para desarrollo local, Expo puede usar un proxy, pero para builds de producción (APK), se usa el scheme personalizado

