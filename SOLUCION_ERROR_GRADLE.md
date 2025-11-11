# Solución al Error de Gradle después de Instalar expo-dev-client

## Problema Identificado

El error de Gradle comenzó después de instalar `expo-dev-client`. Esto es común porque:

1. **expo-dev-client** está diseñado para desarrollo, no para producción
2. Puede causar conflictos en builds de producción si no está configurado correctamente
3. El perfil de producción necesita excluir explícitamente el dev-client

## Solución Aplicada

### 1. Configuración en `eas.json`

He actualizado el perfil de producción para:
- ✅ Deshabilitar explícitamente `developmentClient: false`
- ✅ Especificar el comando de Gradle correcto para release

```json
"production": {
  "autoIncrement": true,
  "developmentClient": false,  // ← IMPORTANTE: Excluir dev-client
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease"
  }
}
```

### 2. Verificación

Antes de hacer el build, verifica:

1. **El perfil de producción NO debe tener `developmentClient: true`**
2. **El perfil de desarrollo SÍ debe tener `developmentClient: true`** (ya está correcto)

## Pasos para el Build

Ahora puedes hacer el build de producción:

```bash
eas build --platform android --profile production
```

## Si el Error Persiste

Si después de estos cambios el error continúa, prueba:

### Opción A: Limpiar y Reconstruir

```bash
# Cancelar cualquier build en progreso
eas build:cancel

# Hacer un build limpio
eas build --platform android --profile production --clear-cache
```

### Opción B: Verificar Dependencias

El problema puede ser una incompatibilidad. Verifica que todas las dependencias sean compatibles:

```bash
npm outdated
npx expo-doctor
```

### Opción C: Mover expo-dev-client a devDependencies (Opcional)

Si solo usas dev-client para desarrollo local, puedes moverlo:

```bash
npm uninstall expo-dev-client
npm install --save-dev expo-dev-client
```

**Nota:** Esto es opcional, la configuración en `eas.json` debería ser suficiente.

## Diferencia entre Perfiles

- **development**: Usa `expo-dev-client` para desarrollo con hot reload
- **preview**: Build de prueba sin dev-client
- **production**: Build final para distribución, sin dev-client

## Verificación Final

Después del build exitoso, verifica que:
- ✅ El APK se genera correctamente
- ✅ La autenticación de Google funciona
- ✅ No hay errores en runtime relacionados con dev-client

