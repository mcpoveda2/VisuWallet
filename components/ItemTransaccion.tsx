// components/TransactionItem.tsx
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaccion } from '../types';

interface TransaccionItemProps {
  transaccion:Transaccion;
  onPress?: () => void;
}

export default function TransaccionItem({ transaccion, onPress }: TransaccionItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between py-3"
    >
      <View className="flex-row items-center flex-1">
        <View className={`bg-neutral-950 w-10 h-10 rounded-xl items-center justify-center mr-3`}>
          <MaterialCommunityIcons name="cash-register" size={24} color="black" />
        </View>

        <View className="flex-1">
          <Text className="text-white font-medium" numberOfLines={1}>
            {transaccion.categoria  }
          </Text>
          <Text className="text-neutral-500 text-sm">
            {transaccion.fecha}
          </Text>
        </View>
      </View>

      <Text className="text-white font-semibold text-lg">
        ${transaccion.monto.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}