import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Categorias({ onSelect, onClose }: { onSelect?: (c: string) => void; onClose?: () => void; }) {
  const categoriasFrecuentes = ["Restaurant", "Interests", "Income", "Active sport"];
  const todasLasCategorias = [
    "Alimentación",
    "Shopping",
    "Vivienda",
    "Transporte",
    "Entretenimiento",
    "Viajes",
    "Regalos",
    "Depositos/Transferencias",
    "Mascotas",
    "Salud",
    "Educación"
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      
      <View className="px-4 py-3 bg-neutral-950 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-white text-center flex-1">Categorias</Text>
        <TouchableOpacity onPress={() => onClose && onClose()} activeOpacity={0.7}>
          <Text className="text-sky-400">Close</Text>
        </TouchableOpacity>
      </View>

      
      <View className="px-4 mt-3">
        <TextInput
          placeholder="Buscar"
          placeholderTextColor="#aaa"
          className="bg-neutral-800 text-white px-4 py-3 rounded-xl"
        />
      </View>

      <ScrollView
        className="mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        
        <View className="px-4 mb-6">
          <Text className="text-sm text-neutral-400 mb-3">Más frecuentes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {categoriasFrecuentes.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                className="bg-neutral-800 px-5 py-3 rounded-2xl mr-3"
                onPress={() => onSelect && onSelect(item)}
              >
                <Text className="text-white font-medium">{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        
        <View className="px-4">
          <Text className="text-sm text-neutral-400 mb-3">Todas las categorias</Text>

          {todasLasCategorias.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              className="flex-row items-center justify-between bg-neutral-800 py-4 px-5 rounded-xl mb-3"
              onPress={() => onSelect && onSelect(item)}
            >
              <Text className="text-white text-base font-medium">{item}</Text>
              <Text className="text-neutral-400">{">"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
