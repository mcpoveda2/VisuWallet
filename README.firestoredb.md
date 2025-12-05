# Firestore Data Model for VisuWallet

## Colecciones y documentos

- `usuarios/{uid}`
  - `nombre`: string
  - `telefono`: string
  - `providerId`: string (opcional)
  - `createdAt`, `updatedAt`: timestamp
  - Subcolección: `cuentas/{cuentaId}`
    - `nombre`: string
    - `numero`: string
    - `tipo`: string
    - `moneda`: string
    - `saldoInicial`: number
    - `notas`: string (opcional)
    - `ownerUid`: string (igual a `uid`)
    - `createdAt`, `updatedAt`: timestamp

- `transacciones/{txId}`
  - Datos del formulario:
    - `monto`: number
    - `tipo`: string
    - `categoria`: string
    - `fecha`: timestamp
    - `descripcion`: string (opcional)
  - Referencias:
    - `refUsuario`: reference → `usuarios/{uid}`
    - `refCuenta`: reference → `usuarios/{uid}/cuentas/{cuentaId}`
  - Campos denormalizados para consultas:
    - `ownerUid`: string
    - `cuentaId`: string
    - `cuentaNumero`: string (opcional)
  - Auditoría:
    - `createdAt`, `updatedAt`: timestamp
    - `createdByUid`: string

## Consultas recomendadas

- Por usuario: `where('ownerUid','==',uid).orderBy('fecha','desc')`
- Por cuenta: `where('ownerUid','==',uid).where('cuentaId','==',cuentaId).orderBy('fecha','desc')`
- Por rango de fechas: `where('ownerUid','==',uid).where('fecha','>=',start).where('fecha','<=',end).orderBy('fecha')`

## Índices sugeridos

Ver `firestore.indexes.json` incluido en el proyecto.

## Reglas de seguridad

Ver `firestore.rules` incluido en el proyecto. En resumen:

- `usuarios` y sus `cuentas` solo son accesibles por su dueño (`request.auth.uid`).
- `transacciones` solo pueden ser leídas/escritas por el dueño (`ownerUid`).
- En `create` de `transacciones` se valida que las referencias apunten al usuario y cuenta correctos.

## Buenas prácticas

- Usar subcolecciones para listas que crecen (cuentas por usuario).
- Mantener denormalización mínima en `transacciones` (`ownerUid`, `cuentaId`, `cuentaNumero`) para consultas rápidas.
- Acompañar referencias (`refUsuario`, `refCuenta`) con IDs planos para filtros.
- Añadir timestamps con `serverTimestamp()` y auditar con `createdByUid`.
