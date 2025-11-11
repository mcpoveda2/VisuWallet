// components/DetalleCuenta.tsx

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import TransaccionItem from "./ItemTransaccion";  // ← REUTILIZAR
import GraficoUltimos30Dias from "./GraficoUltimos30Dias";
import { Cuenta } from "../types";
import { mockTransactions } from "../datosPrueba";
import { db } from 'utils/firebase.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

import { Transaccion } from '../types';

interface DetalleCuentaProps {
  cuenta: Cuenta;
  onBack: () => void;
}

export default function DetalleCuenta({ cuenta, onBack }: DetalleCuentaProps) {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaccion[]>([]);

  useEffect(() => {
    const loadForAccount = async () => {
      try {
        // If cuenta.numero is available, query by accountId field in Firestore
        if (cuenta && (cuenta as any).numero) {
          const accNum = (cuenta as any).numero;
          // query registro where accountId == accNum ordered by date desc
          const q = query(collection(db, 'registro'), where('accountId', '==', accNum), orderBy('date', 'desc'));
          const snap = await getDocs(q);
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
          setTransactions(docs);
          return;
        }

        // Fallback: load all and filter by name/id (best-effort)
        const snap = await getDocs(collection(db, 'registro'));
        const docs = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            tipo: data.type ?? data.tipo ?? 'expense',
            categoria: data.category ?? data.categoria ?? '',
            monto: Number(data.amount ?? data.monto ?? 0),
            fecha: data.date ?? data.fecha ?? (data.createdAt ? data.createdAt.toDate().toString() : ''),
            account: data.account ?? data.cuenta ?? '',
          } as any;
        });

        const filtered = docs.filter((t: any) => {
          if (!t.account) return false;
          return t.account === cuenta.nombre || t.account.includes(cuenta.nombre) || t.account.includes(cuenta.id || '');
        });

        filtered.sort((a: any, b: any) => {
          const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
          const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
          return tb - ta;
        });

        setTransactions(filtered as Transaccion[]);
      } catch (e) {
        console.warn('Failed to load transactions for account', e);
        setTransactions([]);
      }
    };
    loadForAccount();
  }, [cuenta]);

  return (
    <SafeAreaView
      className="flex-1 bg-black"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} className="flex-row items-center">
          <MaterialCommunityIcons name="chevron-left" size={28} color="#3b82f6" />
          <Text className="text-blue-500 text-base font-medium">Back</Text>
        </TouchableOpacity>

        <Text className="text-white text-base font-semibold flex-1 text-center">
          {cuenta.nombre}
        </Text>

        <TouchableOpacity activeOpacity={0.7}>
          <Text className="text-blue-500 text-base font-medium">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View className="mx-4 mt-4 mb-6 bg-neutral-900 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-neutral-400 text-xs font-semibold tracking-wider">
              LAST 30 DAYS
            </Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="arrow-down" size={16} color="#ef4444" />
              <Text className="text-red-500 font-bold text-sm ml-1">47%</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <Text className="text-white text-5xl font-bold">
              ${cuenta.balance.toFixed(2)}
            </Text>
            <TouchableOpacity className="ml-3">
              <MaterialCommunityIcons name="pencil" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Gráfico de 30 días */}
          <GraficoUltimos30Dias transacciones={transactions} />
        </View>

        {/* Historial */}
        <View className="px-4 pb-8">
          {transactions.length === 0 ? (
            <Text className="text-neutral-400">No hay transacciones para esta cuenta.</Text>
          ) : (
            transactions.map((transaccion) => (
              <TransaccionItem
                key={transaccion.id}
                transaccion={transaccion}
                variant="detailed"
                onPress={() => console.log('Ver transacción', transaccion.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Botón Record */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          className="bg-blue-500 flex-row items-center px-6 py-3 rounded-full"
          activeOpacity={0.8}
          style={{
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Record</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}