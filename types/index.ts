// Archivo para definir la estructura  de datos, en este caso de los Accounts

export interface Cuenta {
    id:string;
    nombre:string;
  balance:number;
  numero?: string;
}

// se podría colocar tambien una interface Transaccoin con id, tipo, categoria, monto, date.


export interface Transaccion {
  id: string;
  tipo: 'income' | 'expense' | 'transfer';
  categoria: string;
  monto: number;
  fecha: string;
}