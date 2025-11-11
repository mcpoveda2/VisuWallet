import { Transaccion } from '../types';

export interface CategoriaTotal {
  categoria: string;
  monto: number;
  porcentaje: number;
  cantidad: number;
}

export interface ResumenFinanciero {
  balance: number;
  gastos: number;
  ingresos: number;
  flujoEfectivo: number;
  porcentajeCambio: number;
  topGastos: CategoriaTotal[];
}

// calcular total de ingresos
export function calcularIngresos(transacciones: Transaccion[]): number {
  return transacciones
    .filter(t => t.tipo === 'income')
    .reduce((suma, t) => suma + t.monto, 0);
}

// calcular total de gastos (incluye expense y transfer)
export function calcularGastos(transacciones: Transaccion[]): number {
  return transacciones
    .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
    .reduce((suma, t) => suma + t.monto, 0);
}

// agrupar transacciones por categoria
export function agruparPorCategoria(transacciones: Transaccion[]): CategoriaTotal[] {
  const gastos = transacciones.filter(t => t.tipo === 'expense' || t.tipo === 'transfer');
  const totalGastos = calcularGastos(transacciones);

  const mapaCategoria = gastos.reduce((acc, transaccion) => {
    if (!acc[transaccion.categoria]) {
      acc[transaccion.categoria] = {
        categoria: transaccion.categoria,
        monto: 0,
        porcentaje: 0,
        cantidad: 0,
      };
    }
    acc[transaccion.categoria].monto += transaccion.monto;
    acc[transaccion.categoria].cantidad += 1;
    return acc;
  }, {} as Record<string, CategoriaTotal>);

  const categorias = Object.values(mapaCategoria).map(cat => ({
    ...cat,
    porcentaje: totalGastos > 0
      ? Math.round((cat.monto / totalGastos) * 100)
      : 0,
  }));

  return categorias.sort((a, b) => b.monto - a.monto);
}

// obtener top N categorias por gasto
export function obtenerTopCategorias(
  transacciones: Transaccion[],
  limite: number = 5
): CategoriaTotal[] {
  const categorias = agruparPorCategoria(transacciones);
  return categorias.slice(0, limite);
}

// calcular porcentaje de cambio entre dos periodos
export function calcularPorcentajeCambio(
  periodoActual: Transaccion[],
  periodoAnterior: Transaccion[]
): number {
  const flujoActual =
    calcularIngresos(periodoActual) - calcularGastos(periodoActual);
  const flujoAnterior =
    calcularIngresos(periodoAnterior) - calcularGastos(periodoAnterior);

  if (flujoAnterior === 0) {
    return flujoActual > 0 ? 100 : 0;
  }

  const cambio = ((flujoActual - flujoAnterior) / Math.abs(flujoAnterior)) * 100;
  const cambioRedondeado = Math.round(cambio);

  if (cambioRedondeado > 999) return 999;
  if (cambioRedondeado < -999) return -999;

  return cambioRedondeado;
}

// obtener resumen financiero completo
export function obtenerResumenFinanciero(
  transaccionesActuales: Transaccion[],
  transaccionesAnteriores: Transaccion[] = [],
  todasLasTransacciones: Transaccion[] = []
): ResumenFinanciero {
  const ingresos = calcularIngresos(transaccionesActuales);
  const gastos = calcularGastos(transaccionesActuales);
  const flujoEfectivo = ingresos - gastos;

  // Balance del periodo actual (consistente con gastos e ingresos)
  const balance = flujoEfectivo;

  const porcentajeCambio = calcularPorcentajeCambio(
    transaccionesActuales,
    transaccionesAnteriores
  );
  const topGastos = obtenerTopCategorias(transaccionesActuales, 5);

  return {
    balance,
    gastos,
    ingresos,
    flujoEfectivo,
    porcentajeCambio,
    topGastos,
  };
}

// obtener promedio de gasto por categoria
export function obtenerPromedioPorCategoria(
  transacciones: Transaccion[]
): Record<string, number> {
  const categorias = agruparPorCategoria(transacciones);

  return categorias.reduce((acc, cat) => {
    acc[cat.categoria] = Math.round(cat.monto / cat.cantidad);
    return acc;
  }, {} as Record<string, number>);
}

// obtener tendencia mensual
export function obtenerTendenciaMensual(transacciones: Transaccion[]): {
  mes: string;
  ingresos: number;
  gastos: number;
}[] {
  const mapaMes = transacciones.reduce((acc, transaccion) => {
    const fecha = new Date(transaccion.fecha);
    const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[claveMes]) {
      acc[claveMes] = { mes: claveMes, ingresos: 0, gastos: 0 };
    }

    if (transaccion.tipo === 'income') {
      acc[claveMes].ingresos += transaccion.monto;
    } else {
      acc[claveMes].gastos += transaccion.monto;
    }

    return acc;
  }, {} as Record<string, { mes: string; ingresos: number; gastos: number }>);

  return Object.values(mapaMes).sort((a, b) => a.mes.localeCompare(b.mes));
}
