// data/mockData.ts

import { Cuenta, Transaccion } from './types';

export const mockAccounts: Cuenta[] = [
  {
    id: '1',
    nombre: 'CUENTA DE AHORRO',
    balance: 300.00,
  },
  {
    id: '2',
    nombre: 'VIAJES',
    balance: 150.00,
  },
  {
    id: '3',
    nombre: 'CUENTA TRANSAC...',
    balance: 46.03,
  },
];

export const mockTransactions: Transaccion[] = [
    {
        id: '1',
        tipo: 'expense',
        categoria: 'Bienestar',
        monto: 25.00,
        fecha: 'Metas 01 Nov',
    },
    {
        id: '2',
        tipo: 'expense',
        categoria: 'Pago Tarjeta',
        monto: 15.00,
        fecha: 'Metas 01 Nov',
    },
];

export const getTotalBalance = (): number => {
  return mockAccounts.reduce((total, account) => total + account.balance, 0);
};