import { View, Text, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaccion } from '../types';

interface GraficoBalanceProps {
  balance: number;
  transacciones?: Transaccion[];
  onPressShowMore?: () => void;
}

export default function GraficoBalance({ balance, transacciones = [], onPressShowMore }: GraficoBalanceProps) {
  // Generar datos de últimos 7 días basados en transacciones reales
  const generarDatos7Dias = () => {
    const hoy = new Date();
    const datos: { value: number; label: string; dataPointText: string }[] = [];

    // Calcular balance hacia atrás desde hoy
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 6);

    // Calcular balance inicial (hace 7 días)
    let balanceInicial = balance;
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const transaccionesDia = transacciones.filter(t => {
        const fechaTransaccion = new Date(t.fecha).toISOString().split('T')[0];
        return fechaTransaccion === fechaStr;
      });

      const ingresosdia = transaccionesDia
        .filter(t => t.tipo === 'income')
        .reduce((sum, t) => sum + t.monto, 0);

      const gastosdia = transaccionesDia
        .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
        .reduce((sum, t) => sum + t.monto, 0);

      balanceInicial -= (ingresosdia - gastosdia);
    }

    // Ahora calcular hacia adelante para construir la serie
    let balanceAcumulado = balanceInicial;
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hace7Dias);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const transaccionesDia = transacciones.filter(t => {
        const fechaTransaccion = new Date(t.fecha).toISOString().split('T')[0];
        return fechaTransaccion === fechaStr;
      });

      const ingresosdia = transaccionesDia
        .filter(t => t.tipo === 'income')
        .reduce((sum, t) => sum + t.monto, 0);

      const gastosdia = transaccionesDia
        .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
        .reduce((sum, t) => sum + t.monto, 0);

      balanceAcumulado += (ingresosdia - gastosdia);

      datos.push({
        value: balanceAcumulado,
        label: fecha.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
        dataPointText: `$${(balanceAcumulado / 1000).toFixed(1)}k`
      });
    }

    return datos;
  };

  const datos = generarDatos7Dias();
  const balanceInicial = datos[0]?.value || 0;
  const balanceFinal = balance;
  const cambio = balanceInicial !== 0
    ? ((balanceFinal - balanceInicial) / Math.abs(balanceInicial)) * 100
    : 0;
  const cambioFormateado = cambio.toFixed(1);

  // Calcular máximo y mínimo para el gráfico
  const valoresY = datos.map(d => d.value);
  const maxValor = Math.max(...valoresY);
  const minValor = Math.min(...valoresY);

  return (
    <View className="bg-neutral-900 rounded-2xl p-5 mb-6 border border-neutral-800">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-bold">Balance</Text>
        <Text className={`text-sm font-semibold ${cambio >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {cambio >= 0 ? '+' : ''}{cambioFormateado}%
        </Text>
      </View>

      {/* Balance total */}
      <View className="mb-4">
        <Text className="text-neutral-400 text-xs mb-1 uppercase font-semibold">Balance actual</Text>
        <Text className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>
          ${balance.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
        </Text>
      </View>

      {/* Gráfico de línea con Gifted Charts */}
      <View className="bg-neutral-800 rounded-xl mb-4" style={{ paddingVertical: 10 }}>
        <LineChart
          data={datos}
          height={160}
          width={280}
          spacing={44}
          color="#06B6D4"
          thickness={3}
          startFillColor="#06B6D4"
          endFillColor="#06B6D4"
          startOpacity={0.3}
          endOpacity={0.05}
          areaChart
          curved
          hideDataPoints={false}
          dataPointsColor="#06B6D4"
          dataPointsRadius={6}
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={0}
          xAxisColor="#404040"
          yAxisTextStyle={{ color: '#9CA3AF' }}
          isAnimated
          animationDuration={300}
          noOfSections={4}
          maxValue={maxValor * 1.1}
        />
      </View>

      {/* Leyenda del eje X */}
      <View className="mb-4 bg-neutral-800 rounded-lg p-3">
        <Text className="text-neutral-400 text-xs mb-2 font-semibold">Últimos 7 días</Text>
        <View className="flex-row justify-between">
          {datos.map((d, idx) => (
            <View key={idx} className="items-center">
              <Text className="text-cyan-400 text-xs font-semibold">{d.label}</Text>
              <Text className="text-neutral-500 text-xs mt-0.5">
                ${(d.value / 1000).toFixed(d.value >= 1000 ? 0 : 1)}k
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-neutral-800 rounded-lg p-3">
          <Text className="text-neutral-400 text-xs mb-1">Máximo</Text>
          <Text className="text-green-500 font-bold text-sm">
            ${maxValor.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View className="flex-1 bg-neutral-800 rounded-lg p-3">
          <Text className="text-neutral-400 text-xs mb-1">Mínimo</Text>
          <Text className="text-red-500 font-bold text-sm">
            ${minValor.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View className="flex-1 bg-neutral-800 rounded-lg p-3">
          <Text className="text-neutral-400 text-xs mb-1">Promedio</Text>
          <Text className="text-cyan-500 font-bold text-sm">
            ${(valoresY.reduce((a, b) => a + b, 0) / valoresY.length).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Botón Ver Más */}
      {onPressShowMore && (
        <TouchableOpacity
          onPress={onPressShowMore}
          className="mt-4 bg-neutral-800 rounded-lg py-3 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-cyan-400 font-semibold text-sm">Ver más gráficos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
