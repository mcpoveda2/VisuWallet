import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Transaccion } from '../types';

interface Props {
  visible: boolean;
  transaccion: Transaccion | null;
  onClose: () => void;
}

export default function TransactionDetails({ visible, transaccion, onClose }: Props) {
  if (!transaccion) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {/* Outer pressable: tapping anywhere closes modal */}
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <SafeAreaView className="flex-1 justify-center items-center bg-black/50 px-4">
          {/* Inner view should capture touches so they don't propagate to the Pressable */}
          <View onStartShouldSetResponder={() => true} className="w-full bg-neutral-900 rounded-lg p-4">
          <Text className="text-white text-lg font-semibold mb-3">Transaction details</Text>

          <View className="mb-2">
            <Text className="text-neutral-400 text-sm">Category</Text>
            <Text className="text-white font-medium">{transaccion.categoria || '—'}</Text>
          </View>

          <View className="mb-2">
            <Text className="text-neutral-400 text-sm">Type</Text>
            <Text className="text-white font-medium">{transaccion.tipo}</Text>
          </View>

          <View className="mb-2">
            <Text className="text-neutral-400 text-sm">Amount</Text>
            <Text className="text-white font-medium">${transaccion.monto.toFixed(2)}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-neutral-400 text-sm">Date</Text>
            <Text className="text-white font-medium">{transaccion.fecha || '—'}</Text>
          </View>

          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onClose} className="px-3 py-2">
              <Text className="text-neutral-400">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
