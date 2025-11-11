// components/ItemTransaccion.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaccion } from '../types';

interface TransaccionItemProps {
  transaccion: Transaccion;
  onPress?: () => void;
  variant?: 'compact' | 'detailed';  // ← NUEVA PROP OPCIONAL
}

export default function TransaccionItem({ 
  transaccion, 
  onPress,
  variant = 'compact'  // ← Por defecto 'compact' (para Home)
}: TransaccionItemProps) {
  
  // Estilos según variante
  const isDetailed = variant === 'detailed';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center justify-between ${
        isDetailed ? 'py-4 px-4 bg-neutral-900 rounded-xl mb-3' : 'py-3'
      }`}
    >
      <View className="flex-row items-center flex-1">
        {/* Ícono */}
        <View 
          className={`${
            isDetailed 
              ? 'bg-red-500 w-12 h-12 rounded-full' 
              : 'bg-neutral-950 w-10 h-10 rounded-xl'
          } items-center justify-center mr-3`}
        >
          <MaterialCommunityIcons 
            name={isDetailed ? "food" : "cash-register"} 
            size={isDetailed ? 24 : 20} 
            color={isDetailed ? "white" : "white"} 
          />
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text 
            className={`text-white font-medium ${isDetailed ? 'text-base font-semibold' : ''}`} 
            numberOfLines={1}
          >
            {transaccion.categoria}
          </Text>
          <Text className="text-neutral-500 text-sm">
            {isDetailed ? 'Cuenta transaccional' : transaccion.fecha}
          </Text>
        </View>
      </View>

      {/* Monto */}
      <View className={isDetailed ? 'items-end' : ''}>
        <Text 
          className={`${
            isDetailed ? 'text-red-400' : 'text-white'
          } font-semibold text-lg`}
        >
          {isDetailed ? '-' : ''}${transaccion.monto.toFixed(2)}
        </Text>
        {isDetailed && (
          <Text className="text-neutral-500 text-xs">
            12:00 PM
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}