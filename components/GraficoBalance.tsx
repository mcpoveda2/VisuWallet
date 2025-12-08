import { View, Text, TouchableOpacity } from 'react-native';

interface GraficoBalanceProps {
  balance: number;
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
        const ts = Date.parse(t.fecha as any);
        if (isNaN(ts)) return false;
        const fechaTransaccion = new Date(ts).toISOString().split('T')[0];
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
        const ts = Date.parse(t.fecha as any);
        if (isNaN(ts)) return false;
        const fechaTransaccion = new Date(ts).toISOString().split('T')[0];
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
        <Text className="text-green-500 text-sm font-semibold">+5.2%</Text>
      </View>

      {/* Balance total */}
      <View className="mb-6">
        <Text className="text-neutral-400 text-xs mb-1 uppercase font-semibold">Balance actual</Text>
        <Text className="text-white text-3xl font-bold">
          ${Math.max(0, balance).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
        </Text>
      </View>

      {/* Mini gráfico de línea */}
      <View className="bg-neutral-800 rounded-xl p-4 mb-4">
        <View className="h-12 flex-row items-flex-end justify-around">
          {balances.map((b, idx) => {
            const height = ((b.value - minBalance) / range) * 40 + 4;
            return (
              <View key={idx} className="flex-1 items-center">
                <View
                  className="w-1.5 bg-blue-500 rounded-full"
                  style={{ height: Math.max(4, height) }}
                />
                <Text className="text-neutral-500 text-xs mt-2">
                  {b.day}d
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-neutral-800 rounded-lg p-3">
          <Text className="text-neutral-400 text-xs mb-1">Mayor</Text>
          <Text className="text-green-500 font-bold text-sm">
            ${Math.max(...balances.map(b => b.value)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View className="flex-1 bg-neutral-800 rounded-lg p-3">
          <Text className="text-neutral-400 text-xs mb-1">Promedio</Text>
          <Text className="text-blue-500 font-bold text-sm">
            ${(balances.reduce((s, b) => s + b.value, 0) / daysAgo).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Botón "Ver gráficos completos" */}
      <TouchableOpacity onPress={onPressShowMore} activeOpacity={0.7} className="mt-4">
        <Text className="text-blue-500 font-medium text-center">
          Ver gráficos completos →
        </Text>
      </TouchableOpacity>
    </View>
  );
}