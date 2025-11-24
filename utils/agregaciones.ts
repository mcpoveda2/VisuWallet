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

// obtener tendencia semestral (últimos 6 meses)
export function obtenerTendenciaSemestral(transacciones: Transaccion[]): {
  mes: string;
  mesNombre: string;
  ingresos: number;
  gastos: number;
}[] {
  const nombresMeses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const hoy = new Date();
  const resultado: { mes: string; mesNombre: string; ingresos: number; gastos: number }[] = [];

  // Generar los últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const claveMes = `${año}-${String(mes + 1).padStart(2, '0')}`;
    const mesNombre = nombresMeses[mes];

    resultado.push({
      mes: claveMes,
      mesNombre,
      ingresos: 0,
      gastos: 0,
    });
  }

  // Llenar con datos de transacciones
  transacciones.forEach(transaccion => {
    const fecha = new Date(transaccion.fecha);
    const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const index = resultado.findIndex(r => r.mes === claveMes);

    if (index !== -1) {
      if (transaccion.tipo === 'income') {
        resultado[index].ingresos += transaccion.monto;
      } else {
        resultado[index].gastos += transaccion.monto;
      }
    }
  });

  return resultado;
}

// obtener tendencia anual (últimos 12 meses)
export function obtenerTendenciaAnual(transacciones: Transaccion[]): {
  mes: string;
  mesNombre: string;
  ingresos: number;
  gastos: number;
}[] {
  const nombresMeses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const hoy = new Date();
  const resultado: { mes: string; mesNombre: string; ingresos: number; gastos: number }[] = [];

  // Generar los últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const claveMes = `${año}-${String(mes + 1).padStart(2, '0')}`;
    const mesNombre = nombresMeses[mes];

    resultado.push({
      mes: claveMes,
      mesNombre,
      ingresos: 0,
      gastos: 0,
    });
  }

  // Llenar con datos de transacciones
  transacciones.forEach(transaccion => {
    const fecha = new Date(transaccion.fecha);
    const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const index = resultado.findIndex(r => r.mes === claveMes);

    if (index !== -1) {
      if (transaccion.tipo === 'income') {
        resultado[index].ingresos += transaccion.monto;
      } else {
        resultado[index].gastos += transaccion.monto;
      }
    }
  });

  return resultado;
}

// detectar outliers usando el metodo IQR (Interquartile Range)
export function detectarOutliers(valores: number[]): {
  outliers: number[];
  indices: number[];
  q1: number;
  q3: number;
  iqr: number;
} {
  if (valores.length === 0) {
    return { outliers: [], indices: [], q1: 0, q3: 0, iqr: 0 };
  }

  const sorted = [...valores].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const indices: number[] = [];

  valores.forEach((valor, index) => {
    if (valor < lowerBound || valor > upperBound) {
      outliers.push(valor);
      indices.push(index);
    }
  });

  return { outliers, indices, q1, q3, iqr };
}

// formatear moneda de manera adaptiva segun el rango
export function formatearMonedaAdaptiva(valor: number, maxValor: number): string {
  const absMax = Math.abs(maxValor);

  if (absMax >= 1000000) {
    // Millones
    return `$${(valor / 1000000).toFixed(1)}M`;
  } else if (absMax >= 10000) {
    // Miles (solo si es mayor a 10k)
    return `$${(valor / 1000).toFixed(1)}k`;
  } else if (absMax >= 1000) {
    // Miles sin decimales
    return `$${(valor / 1000).toFixed(0)}k`;
  } else {
    // Valores completos
    return `$${Math.round(valor)}`;
  }
}

// calcular estadisticas basicas de un conjunto de valores
export function calcularEstadisticas(valores: number[]): {
  min: number;
  max: number;
  media: number;
  mediana: number;
  desviacionEstandar: number;
} {
  if (valores.length === 0) {
    return { min: 0, max: 0, media: 0, mediana: 0, desviacionEstandar: 0 };
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;

  const sorted = [...valores].sort((a, b) => a - b);
  const medianaIndex = Math.floor(sorted.length / 2);
  const mediana = sorted.length % 2 === 0
    ? (sorted[medianaIndex - 1] + sorted[medianaIndex]) / 2
    : sorted[medianaIndex];

  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  const desviacionEstandar = Math.sqrt(varianza);

  return { min, max, media, mediana, desviacionEstandar };
}

// calcular dominio del eje Y con padding inteligente
export function calcularDominioY(valores: number[], padding: number = 0.1): [number, number] {
  if (valores.length === 0) {
    return [0, 100];
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min;

  // Si el rango es muy pequeño, usar valores por defecto
  if (rango < 1) {
    return [Math.floor(min - 10), Math.ceil(max + 10)];
  }

  // Agregar padding proporcional
  const paddingValor = rango * padding;
  const minConPadding = min - paddingValor;
  const maxConPadding = max + paddingValor;

  return [
    Math.floor(minConPadding < 0 ? minConPadding : 0),
    Math.ceil(maxConPadding)
  ];
}

// calcular tasa de ahorro (savings rate)
export function calcularTasaAhorro(ingresos: number, gastos: number): number {
  if (ingresos === 0) return 0;
  const ahorro = ingresos - gastos;
  const tasa = (ahorro / ingresos) * 100;
  return Math.round(tasa * 10) / 10; // Redondear a 1 decimal
}

// calcular promedio movil simple
export function calcularPromedioMovil(valores: number[], ventana: number = 3): number[] {
  if (valores.length < ventana) return valores;

  const resultado: number[] = [];
  for (let i = 0; i < valores.length; i++) {
    if (i < ventana - 1) {
      resultado.push(valores[i]);
    } else {
      const suma = valores.slice(i - ventana + 1, i + 1).reduce((a, b) => a + b, 0);
      resultado.push(suma / ventana);
    }
  }
  return resultado;
}

// calcular gasto promedio diario
export function calcularGastoPromedioDiario(transacciones: Transaccion[], dias: number = 30): number {
  const gastos = calcularGastos(transacciones);
  return gastos / dias;
}

// obtener mejor y peor categoria por gasto
export function obtenerMejorPeorCategoria(transacciones: Transaccion[]): {
  mejor: CategoriaTotal | null;
  peor: CategoriaTotal | null;
} {
  const categorias = agruparPorCategoria(transacciones);
  if (categorias.length === 0) {
    return { mejor: null, peor: null };
  }

  // La "mejor" es la que menos gastó
  const mejor = categorias[categorias.length - 1];
  // La "peor" es la que más gastó
  const peor = categorias[0];

  return { mejor, peor };
}
