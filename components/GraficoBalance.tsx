import { View, Text, TouchableOpacity } from 'react-native';

interface GraficoBalanceProps {
  balance: number;
  onPressShowMore?: () => void;
}

export default function GraficoBalance({ balance, onPressShowMore }: GraficoBalanceProps) {
  // Generar datos de ejemplo (últimos 7 días)
  const daysAgo = 7;
  const balances = Array.from({ length: daysAgo }, (_, i) => ({
    day: i + 1,
    value: Math.max(0, balance - (Math.random() * balance * 0.3))
  }));

  const maxBalance = Math.max(...balances.map(b => b.value), balance);
  const minBalance = Math.min(...balances.map(b => b.value), 0);
  const range = maxBalance - minBalance || 1;

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