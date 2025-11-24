import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Transaccion } from '../types';
import { formatearMonedaAdaptiva, calcularDominioY } from '../utils/agregaciones';

interface GraficoUltimos30DiasProps {
  transacciones: Transaccion[];
}

export default function GraficoUltimos30Dias({ transacciones }: GraficoUltimos30DiasProps) {
  // Obtener datos de los últimos 30 días
  const hoy = new Date();
  const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const datos = Array.from({ length: 30 }, (_, i) => {
    const fecha = new Date(hace30Dias.getTime() + i * 24 * 60 * 60 * 1000);
    const fechaStr = fecha.toISOString().split('T')[0];

    const transaccionesDelDia = transacciones.filter(t => {
      if (!t.fecha) return false;
      const tFecha = new Date(t.fecha);
      return tFecha.toISOString().split('T')[0] === fechaStr;
    });

    const gastos = transaccionesDelDia
      .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
      .reduce((sum, t) => sum + t.monto, 0);

    const ingresos = transaccionesDelDia
      .filter(t => t.tipo === 'income')
      .reduce((sum, t) => sum + t.monto, 0);

    return {
      x: i + 1,
      dia: fecha.getDate(),
      gastos,
      ingresos,
      neto: ingresos - gastos
    };
  });

  const totalGastos = datos.reduce((s, d) => s + d.gastos, 0);
  const totalIngresos = datos.reduce((s, d) => s + d.ingresos, 0);

  // Calcular dominio Y con padding adaptivo
  const todosLosValores = [...datos.map(d => d.ingresos), ...datos.map(d => d.gastos)];
  const [minY, maxY] = calcularDominioY(todosLosValores, 0.15);

  return (
    <View className="bg-neutral-900 rounded-xl p-4">
      {/* Encabezado */}
      <Text className="text-white text-sm font-semibold mb-4">Últimos 30 días</Text>

      {/* Resumen */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <Text className="text-red-400 text-xs uppercase mb-1 font-semibold">Total Gastos</Text>
          <Text className="text-red-500 font-bold text-base">
            ${totalGastos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <Text className="text-green-400 text-xs uppercase mb-1 font-semibold">Total Ingresos</Text>
          <Text className="text-green-500 font-bold text-base">
            ${totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Gráfico de líneas con Victory Native */}
      <View className="bg-neutral-800 rounded-lg mb-4" style={{ height: 200 }}>
        <CartesianChart
          data={datos}
          xKey="x"
          yKeys={['ingresos', 'gastos']}
          domainPadding={{ top: 20, bottom: 20 }}
          domain={{ y: [minY, maxY] }}
          axisOptions={{
            formatXLabel: (value: any) => {
              const index = Math.floor(value) - 1;
              if (index >= 0 && index < datos.length && index % 5 === 0) {
                return `${datos[index].dia}`;
              }
              return '';
            },
            formatYLabel: (value: any) => formatearMonedaAdaptiva(value, maxY)
          }}
        >
          {({ points }: any) => (
            <>
              {/* Línea de Ingresos (verde) */}
              <Line
                points={points.ingresos}
                color="#22C55E"
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: 'timing', duration: 300 }}
              />
              {/* Línea de Gastos (roja) */}
              <Line
                points={points.gastos}
                color="#EF4444"
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: 'timing', duration: 300 }}
              />
            </>
          )}
        </CartesianChart>
      </View>

      {/* Leyenda */}
      <View className="flex-row justify-center gap-6">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#EF4444' }} />
          <Text className="text-neutral-400 text-xs">Gastos</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#22C55E' }} />
          <Text className="text-neutral-400 text-xs">Ingresos</Text>
        </View>
      </View>
    </View>
  );
}
