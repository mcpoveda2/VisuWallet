import React, { useEffect, useState } from "react";
// components/Home.tsx

import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import CuentaCard from "./CuentaCard";
import TransaccionItem from "./ItemTransaccion";
import GraficoBalance from "./GraficoBalance";
import NavBar from "./NavBar";  // ← IMPORTAR
import TransaccionList from './TransaccionList';
import AddCuenta from './AddCuenta';

import { mockTransactions } from "../datosPrueba";
import { db } from "utils/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import { Transaccion } from "../types";
import TransactionDetails from './TransactionDetails';

import { Cuenta } from "../types";

interface HomeProps {
  onPressAdd: () => void;
  onPressAccount: (cuenta: Cuenta) => void;
  onPressEstadisticas?: () => void;
  onPressCharts?: () => void;
}

export default function Home({ onPressAdd, onPressAccount, onPressEstadisticas, onPressCharts }: HomeProps) {
  const insets = useSafeAreaInsets();
  const nombreUsuario = "Sebas";
  const [accounts, setAccounts] = useState<{id:string; nombre:string; balance:number}[]>([]);
  const [transactions, setTransactions] = useState<Transaccion[]>(mockTransactions);
  const balanceTotal = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddCuenta, setShowAddCuenta] = useState(false);

  // Load transactions and accounts from Firestore
  const loadAll = async () => {
    try {
      // transactions
      const snap = await getDocs(collection(db, 'registro'));
      const docs = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          tipo: data.type ?? data.tipo ?? 'expense',
          categoria: data.category ?? data.categoria ?? '',
          monto: Number(data.amount ?? data.monto ?? 0),
          fecha: data.date ?? data.fecha ?? (data.createdAt ? data.createdAt.toDate().toString() : ''),
        } as Transaccion;
      });
      docs.sort((a,b) => {
        const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
        const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
        return tb - ta;
      });
      setTransactions(docs.slice(0,4));

      // accounts
      const snapAcc = await getDocs(collection(db, 'cuentas'));
      const accs = snapAcc.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          nombre: data.propietario ?? data.nombre ?? `Cuenta ${d.id}`,
          balance: Number(data.saldo ?? data.balance ?? 0),
          numero: data.numero ?? '',
        };
      });
      setAccounts(accs);
    } catch (e) {
      console.warn('Failed to load data from Firestore, using fallbacks', e);
      // leave transactions as mocks and accounts empty
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-black m-safe p-safe"
      style={{
        paddingTop: insets.top,
        paddingBottom: 0,
      }}
    >
      <ScrollView 
        className="flex-1 -mt-16"
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
            {accounts.map((cuenta) => (
              <CuentaCard
                key={cuenta.id}
                cuenta={{ id: cuenta.id, nombre: cuenta.nombre, balance: cuenta.balance }}
                onPress={() => onPressAccount(cuenta)}
              />
            ))}

            <TouchableOpacity
              onPress={() => setShowAddCuenta(true)}
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
          <GraficoBalance balance={balanceTotal} onPressShowMore={onPressCharts} />
        </View>

        {/* Transacciones recientes */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">
              Transacciones recientes
            </Text>
            <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#737373" />
            </TouchableOpacity>
          </View>

          {transactions.map((transaccion) => (
            <TransaccionItem
              key={transaccion.id}
              transaccion={transaccion}
              onPress={() => setSelectedTx(transaccion)}
            />
          ))}
        </View>
      </ScrollView>

      {/* NavBar */}
      <NavBar
        onPressAdd={onPressAdd}
        onPressHome={() => {}}
        onPressEstadisticas={onPressEstadisticas}
        onPressCharts={onPressCharts}
        activeScreen="home"
      />

      {/* Transaction details modal */}
      <TransactionDetails visible={!!selectedTx} transaccion={selectedTx} onClose={() => setSelectedTx(null)} />
      <TransaccionList visible={showAllTransactions} onClose={() => setShowAllTransactions(false)} />
      <AddCuenta visible={showAddCuenta} onClose={() => setShowAddCuenta(false)} onSaved={async (id) => { console.log('Cuenta guardada', id); await loadAll(); }} />
    </SafeAreaView>
  );
}