import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { Transaccion } from '../types';
import { formatearMonedaAdaptiva, calcularDominioY } from '../utils/agregaciones';
import GraficoBarrasSemanal from './GraficoBarrasSemanal';

interface GraficoEvolucionCuentaProps {
  transacciones: Transaccion[];
  saldoActual: number;
  nombreCuenta: string;
}

export default function GraficoEvolucionCuenta({
  transacciones,
  saldoActual,
  nombreCuenta
}: GraficoEvolucionCuentaProps) {
  // Generar datos de evolución de los últimos 30 días
  const generarDatosEvolucion = () => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 29);

    const datos: { x: number; y: number; dia: number }[] = [];

    // Calcular saldo inicial (hace 30 días)
    let saldoInicial = saldoActual;
    for (let i = 0; i < 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const transaccionesDia = transacciones.filter(t => {
        if (!t.fecha) return false;
        const tFecha = new Date(t.fecha);
        return tFecha.toISOString().split('T')[0] === fechaStr;
      });

      const movimiento = transaccionesDia.reduce((sum, t) => {
        if (t.tipo === 'income') return sum + t.monto;
        if (t.tipo === 'expense' || t.tipo === 'transfer') return sum - t.monto;
        return sum;
      }, 0);

      saldoInicial -= movimiento;
    }

    // Construir serie hacia adelante
    let saldoAcumulado = saldoInicial;
    for (let i = 0; i < 30; i++) {
      const fecha = new Date(hace30Dias);
      fecha.setDate(hace30Dias.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const transaccionesDia = transacciones.filter(t => {
        if (!t.fecha) return false;
        const tFecha = new Date(t.fecha);
        return tFecha.toISOString().split('T')[0] === fechaStr;
      });

      const movimiento = transaccionesDia.reduce((sum, t) => {
        if (t.tipo === 'income') return sum + t.monto;
        if (t.tipo === 'expense' || t.tipo === 'transfer') return sum - t.monto;
        return sum;
      }, 0);

      saldoAcumulado += movimiento;

      datos.push({
        x: i + 1,
        y: saldoAcumulado,
        dia: fecha.getDate()
      });
    }

    return datos;
  };

  const datos = generarDatosEvolucion();
  const valoresY = datos.map(d => d.y);
  const [minY, maxY] = calcularDominioY(valoresY, 0.15);

  const saldoInicial = datos[0]?.y || 0;
  const cambio = saldoInicial !== 0
    ? ((saldoActual - saldoInicial) / Math.abs(saldoInicial)) * 100
    : 0;

  return (
    <View className="px-5 mb-4">
      <View className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-sm font-bold">Evolución de Saldo</Text>
          <Text className={`text-xs font-semibold ${cambio >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}% (30d)
          </Text>
        </View>

        {/* Info de cuenta */}
        <View className="mb-3">
          <Text className="text-neutral-400 text-xs mb-1">{nombreCuenta}</Text>
          <Text className="text-white text-2xl font-bold">
            ${saldoActual.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        {/* Gráfico */}
        <View className="bg-neutral-800 rounded-lg" style={{ height: 150 }}>
          <CartesianChart
            data={datos}
            xKey="x"
            yKeys={['y'] as const}
            domainPadding={{ top: 20, bottom: 20, left: 10, right: 10 }}
            domain={{ y: [minY, maxY] }}
            axisOptions={{
              formatXLabel: (value: any) => {
                const index = Math.floor(value) - 1;
                if (index >= 0 && index < datos.length && index % 7 === 0) {
                  return `${datos[index].dia}`;
                }
                return '';
              },
              formatYLabel: (value: any) => formatearMonedaAdaptiva(value, maxY),
              lineColor: '#404040',
              labelColor: '#9CA3AF',
              tickCount: 4
            }}
          >
            {({ points }: any) => (
              <>
                <Line
                  points={points.y}
                  color="#8B5CF6"
                  strokeWidth={2.5}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 300 }}
                />
                {points.y.map((point: any, index: number) => {
                  // Solo mostrar puntos cada 5 días
                  if (index % 5 === 0 || index === points.y.length - 1) {
                    return (
                      <Circle
                        key={`circle-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        color="#8B5CF6"
                      />
                    );
                  }
                  return null;
                })}
              </>
            )}
          </CartesianChart>
        </View>

        {/* Estadísticas */}
        <View className="flex-row gap-2 mt-3">
          <View className="flex-1 bg-neutral-800 rounded-lg p-2">
            <Text className="text-neutral-400 text-xs">Inicio (30d)</Text>
            <Text className="text-purple-400 font-bold text-sm">
              ${saldoInicial.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View className="flex-1 bg-neutral-800 rounded-lg p-2">
            <Text className="text-neutral-400 text-xs">Máximo</Text>
            <Text className="text-green-500 font-bold text-sm">
              ${Math.max(...valoresY).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View className="flex-1 bg-neutral-800 rounded-lg p-2">
            <Text className="text-neutral-400 text-xs">Mínimo</Text>
            <Text className="text-red-500 font-bold text-sm">
              ${Math.min(...valoresY).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfico Semanal */}
      <View className="mt-4">
        <GraficoBarrasSemanal transacciones={transacciones} />
      </View>
    </View>
  );
}
