import { Transaccion } from './lectorCsv';

export type FiltroRango = 'semana' | 'mes' | 'año';

// obtener rango de fechas segun filtro
export function obtenerRangoFechas(filtro: FiltroRango, fechaBase?: Date): { inicio: Date; fin: Date } {
  const ahora = fechaBase ? new Date(fechaBase) : new Date();
  const fin = new Date(ahora);
  let inicio = new Date(ahora);

  switch (filtro) {
    case 'semana':
      inicio.setDate(ahora.getDate() - 7);
      break;
    case 'mes':
      //mes actual
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      break;
    case 'año':
      //año actual
      inicio.setMonth(0, 1);
      inicio.setHours(0, 0, 0, 0);
      break;
  }

  return { inicio, fin };
}

// filtrar transacciones por rango de fecha
export function filtrarPorRangoFecha(
  transacciones: Transaccion[],
  filtro: FiltroRango,
  fechaBase?: Date
): Transaccion[] {
  const { inicio, fin } = obtenerRangoFechas(filtro, fechaBase);

  return transacciones.filter(transaccion => {
    const fechaTransaccion = new Date(transaccion.fecha);
    return fechaTransaccion >= inicio && fechaTransaccion <= fin;
  });
}

// obtener transacciones del periodo anterior
export function obtenerPeriodoAnterior(
  transacciones: Transaccion[],
  filtro: FiltroRango,
  fechaBase?: Date
): Transaccion[] {
  const { inicio, fin } = obtenerRangoFechas(filtro, fechaBase);
  const duracion = fin.getTime() - inicio.getTime();

  const finAnterior = new Date(inicio);
  finAnterior.setTime(finAnterior.getTime() - 1);

  const inicioAnterior = new Date(finAnterior);
  inicioAnterior.setTime(inicioAnterior.getTime() - duracion);

  return transacciones.filter(transaccion => {
    const fecha = new Date(transaccion.fecha);
    return fecha >= inicioAnterior && fecha <= finAnterior;
  });
}

//filtrar por mes especifico
export function filtrarPorMes(
  transacciones: Transaccion[],
  año: number,
  mes: number
): Transaccion[] {
  return transacciones.filter(transaccion => {
    const fecha = new Date(transaccion.fecha);
    return fecha.getFullYear() === año && fecha.getMonth() === mes;
  });
}

//filtrar por año especifico
export function filtrarPorAño(
  transacciones: Transaccion[],
  año: number
): Transaccion[] {
  return transacciones.filter(transaccion => {
    const fecha = new Date(transaccion.fecha);
    return fecha.getFullYear() === año;
  });
}

//filtrar por rango personalizado
export function filtrarPorRangoPersonalizado(
  transacciones: Transaccion[],
  fechaInicio: Date,
  fechaFin: Date
): Transaccion[] {
  return transacciones.filter(transaccion => {
    const fecha = new Date(transaccion.fecha);
    return fecha >= fechaInicio && fecha <= fechaFin;
  });
}

// obtener texto formateado del rango de fechas
export function obtenerTextoRango(filtro: FiltroRango, fechaBase?: Date): string {
  const { inicio, fin } = obtenerRangoFechas(filtro, fechaBase);

  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mesesCompletos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  switch (filtro) {
    case 'semana':
      const diaInicio = inicio.getDate();
      const diaFin = fin.getDate();
      const mesAbrev = meses[fin.getMonth()];
      const año = fin.getFullYear();
      return `${diaInicio}-${diaFin} ${mesAbrev} ${año}`;

    case 'mes':
      const mesCompleto = mesesCompletos[fin.getMonth()];
      return `${mesCompleto} ${fin.getFullYear()}`;

    case 'año':
      return `${fin.getFullYear()}`;

    default:
      return '';
  }
}

// navegar al periodo anterior
export function irAPeriodoAnterior(filtro: FiltroRango, fechaActual: Date): Date {
  const nuevaFecha = new Date(fechaActual);

  switch (filtro) {
    case 'semana':
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
      break;
    case 'mes':
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      break;
    case 'año':
      nuevaFecha.setFullYear(nuevaFecha.getFullYear() - 1);
      break;
  }

  return nuevaFecha;
}

// navegar al periodo siguiente
export function irAPeriodoSiguiente(filtro: FiltroRango, fechaActual: Date): Date {
  const nuevaFecha = new Date(fechaActual);

  switch (filtro) {
    case 'semana':
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      break;
    case 'mes':
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      break;
    case 'año':
      nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
      break;
  }

  return nuevaFecha;
}
