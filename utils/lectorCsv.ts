import transaccionesData from '../assets/data/transacciones.json';

export interface Transaccion {
  fecha: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  monto: number;
  descripcion: string;
}

// cargar transacciones desde JSON
export async function cargarTransaccionesDesdeArchivo(): Promise<Transaccion[]> {
  try {
    console.log(`${transaccionesData.length} transacciones cargadas exitosamente`);
    return transaccionesData as Transaccion[];
  } catch (error) {
    console.error('Error cargando datos:', error);
    return [];
  }
}

// obtener resumen de datos
export function obtenerResumenDatos(transacciones: Transaccion[]): void {
  const totalIngresos = transacciones.filter(t => t.tipo === 'ingreso').length;
  const totalGastos = transacciones.filter(t => t.tipo === 'gasto').length;

  console.log('RESUMEN DE DATOS:');
  console.log(`   Total transacciones: ${transacciones.length}`);
  console.log(`   Ingresos: ${totalIngresos}`);
  console.log(`   Gastos: ${totalGastos}`);

  if (transacciones.length > 0) {
    const fechas = transacciones.map(t => new Date(t.fecha)).sort((a, b) => a.getTime() - b.getTime());
    const fechaInicio = fechas[0].toLocaleDateString('es-CO');
    const fechaFin = fechas[fechas.length - 1].toLocaleDateString('es-CO');
    console.log(`   Rango: ${fechaInicio} - ${fechaFin}`);
  }
}
