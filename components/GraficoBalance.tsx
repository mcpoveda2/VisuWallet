// componente reutilizable de graficosBalance, pero el grafico en si, se encarga g2.

import { View, Text, TouchableOpacity } from 'react-native';

interface GraficoBalanceProps {
  balance: number;
}

export default function GraficoBalance({ balance }: GraficoBalanceProps) {
  return (
    <View className="bg-neutral-800 rounded-2xl p-4 mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">Tendencia del Balance</Text>
        <Text className="text-neutral-500">•••</Text>
      </View>

      {/* Balance total */}
      <View className="mb-4">
        <Text className="text-neutral-400 text-sm mb-1">HOY</Text>
        <Text className="text-white text-4xl font-bold">
          ${balance.toFixed(2)}
        </Text>
      </View>

      {/* Placeholder para el gráfico */}
      <View className="bg-neutral-700 rounded-xl h-48 items-center justify-center mb-4">
        <Text className="text-neutral-500 text-center px-4">
          Gráfico{'\n'}
          (........)
        </Text>
      </View>

      {/* Botón "Mostrar más" */}
      <TouchableOpacity activeOpacity={0.7}>
        <Text className="text-blue-500 font-medium text-right">
          Mostrar más
        </Text>
      </TouchableOpacity>
    </View>
  );
}