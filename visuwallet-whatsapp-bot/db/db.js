const fs = require('fs');
const path = require('path');

/**
 * DBProvider = contrato (interfaz).
 * Cualquier DB que quieras usar debe implementar saveTransaction(tx).
 */
class DBProvider {
  async saveTransaction(tx) {
    throw new Error("saveTransaction(tx) no implementado");
  }
}

/**
 * LocalJSONProvider = implementación local.
 * Guarda transacciones en data/transactions.json.
 */
class LocalJSONProvider extends DBProvider {
  constructor(filePath) {
    super();
    this.filePath = filePath;

    // Si el archivo no existe, lo crea vacío
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, '[]');
    }
  }

  async saveTransaction(tx) {
    // 1) Leer JSON actual
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const lista = JSON.parse(raw);

    // 2) Crear nueva transacción con metadata
    const nueva = {
      id: Date.now().toString(),
      ...tx,
      origen: 'whatsapp',
      createdAt: new Date().toISOString(),
    };

    // 3) Agregar y persistir
    lista.push(nueva);
    fs.writeFileSync(this.filePath, JSON.stringify(lista, null, 2));

    return nueva;
  }
}

module.exports = { DBProvider, LocalJSONProvider };
