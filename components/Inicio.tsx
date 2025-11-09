import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface InicioProps {
  onPressManual: () => void;  // ← NUEVA PROP
  onBack: () => void;          // ← NUEVA PROP
}

export default function Inicio({ onPressManual, onBack }: InicioProps) {  // ← RECIBIR PROPS
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-black"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Botón de volver */}
      <View className="px-6 py-4">
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-white mb-10 text-center">
          Empieza a controlar tus finanzas desde un click
        </Text>

        <View className="w-full space-y-5">
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-sky-600 py-4 rounded-2xl items-center shadow-lg shadow-sky-800 mb-10 mt-20 w-full"
          >
            <Text className="text-white text-lg font-semibold">Telegram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-emerald-600 py-4 rounded-2xl items-center shadow-lg shadow-emerald-800 mt-20 mb-20 w-full"
          >
            <Text className="text-white text-lg font-semibold">Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressManual}  
            activeOpacity={0.8}
            className="bg-violet-600 py-4 rounded-2xl items-center shadow-lg shadow-violet-800 mt-5 mb-30 w-full"
          >
            <Text className="text-white text-lg font-semibold">Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}