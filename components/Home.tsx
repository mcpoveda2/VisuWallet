// components/Home.tsx

import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import CuentaCard from "./CuentaCard";
import TransaccionItem from "./ItemTransaccion";
import GraficoBalance from "./GraficoBalance";
import NavBar from "./NavBar";

import { mockAccounts, mockTransactions, getTotalBalance } from "../datosPrueba";
import { Cuenta } from "../types";

interface HomeProps {
  onPressAdd: () => void;
  onPressAccount: (cuenta: Cuenta) => void;
}

export default function Home({ onPressAdd, onPressAccount }: HomeProps) {
  const insets = useSafeAreaInsets();
  const balanceTotal = getTotalBalance();
  const nombreUsuario = "Sebas";

  return (
    <SafeAreaView
      className="flex-1 bg-black"
      style={{
        paddingTop: insets.top,
        paddingBottom: 0,
      }}
    >
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 90
        }}
      >
        {/* Header: Saludo + Íconos */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View>
            <Text className="text-white text-2xl font-bold">
              Hola, <Text className="text-pink-500">{nombreUsuario}</Text>
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="w-10 h-10 bg-neutral-800 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-10 h-10 bg-neutral-800 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid de cuentas */}
        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap justify-between">
            {mockAccounts.map((cuenta) => (
              <CuentaCard
                key={cuenta.id}
                cuenta={cuenta}
                onPress={() => onPressAccount(cuenta)}
              />
            ))}

            <TouchableOpacity
              onPress={() => console.log('Agregar cuenta')}
              activeOpacity={0.8}
              className="bg-neutral-800 rounded-2xl p-4 w-[48%] items-center justify-center mb-4"
            >
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mb-2">
                <MaterialCommunityIcons name="plus" size={24} color="white" />
              </View>
              <Text className="text-white text-sm font-medium">Agregar cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gráfico */}
        <View className="px-6">
          <GraficoBalance balance={balanceTotal} />
        </View>

        {/* Transacciones recientes */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">
              Transacciones recientes
            </Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#737373" />
            </TouchableOpacity>
          </View>

          {mockTransactions.map((transaccion) => (
            <TransaccionItem
              key={transaccion.id}
              transaccion={transaccion}
              onPress={() => console.log('Ver transacción', transaccion.id)}
            />
          ))}
        </View>
      </ScrollView>

      <NavBar onPressAdd={onPressAdd} />
    </SafeAreaView>
  );
}