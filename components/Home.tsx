import React, { useEffect, useState } from "react";
// components/Home.tsx

import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import CuentaCard from "./CuentaCard";
import TransaccionItem from "./ItemTransaccion";
import GraficoBalance from "./GraficoBalance";
import NavBar from "./NavBar";
import TransaccionList from './TransaccionList';
import AddCuenta from './AddCuenta';
import KPICard from './KPICard';

import { mockTransactions } from "../datosPrueba";
import { db } from "utils/firebase.js";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Transaccion } from "../types";
import TransactionDetails from './TransactionDetails';

import { Cuenta } from "../types";
import { listCuentas } from "../services/firestore";

interface HomeProps {
  onPressAdd: () => void;
  onPressAccount: (cuenta: Cuenta) => void;
  onPressEstadisticas?: () => void;
  onPressCharts?: () => void;
}

export default function Home({ onPressAdd, onPressAccount, onPressEstadisticas, onPressCharts }: HomeProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const nombreUsuario = user?.displayName || user?.email || 'Invitado';
  const handleLogout = async () => {
    try {
      await signOutUser();
      // optionally ensure anonymous session after logout
      // Anonymous login removed; require user to sign in
    } catch (e) {
      console.warn('No se pudo cerrar sesión');
    }
  };
  const [accounts, setAccounts] = useState<Cuenta[]>([]);
  const [transactions, setTransactions] = useState<Transaccion[]>(mockTransactions);
  const [allTransactions, setAllTransactions] = useState<Transaccion[]>([]); // Todas las transacciones para gráficos
  const balanceTotal = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddCuenta, setShowAddCuenta] = useState(false);

  // Load transactions and accounts from Firestore
  const loadAll = async () => {
    try {
      // transactions
      const snap = await getDocs(collection(db, 'transacciones'));
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
      setAllTransactions(docs); // Guardar todas las transacciones
      setTransactions(docs.slice(0,4)); // Solo las primeras 4 para mostrar

      // accounts
      const accsRaw = await listCuentas(user?.uid || undefined);
      const accs: Cuenta[] = accsRaw.map(d => ({
        id: d.id,
        nombre: d.propietario ?? `Cuenta ${d.id}`,
        balance: Number(d.saldo ?? 0),
        numero: d.numero ?? '',
        tipo: d.tipo ?? 'corriente',
      }));
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
      className="flex-1 bg-black"
      style={{
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
        <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
          <View>
            <Text className="text-white text-2xl font-bold">
              Hola, <Text className="text-blue-500">{nombreUsuario}</Text>
            </Text>
            <Text className="text-neutral-400 text-xs mt-1">
              Auth: {user?.providerData?.[0]?.providerId ?? 'anonymous'}
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
              onPress={handleLogout}
              className="w-10 h-10 bg-neutral-800 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid de cuentas */}
        <View className="px-6 mb-6">
          {accounts.length === 0 ? (
            <View className="bg-neutral-900 rounded-2xl p-6 items-center">
              <MaterialCommunityIcons name="bank-off-outline" size={48} color="#9CA3AF" />
              <Text className="text-neutral-400 text-center mt-3 mb-4">
                No tienes cuentas registradas
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddCuenta(true)}
                className="bg-blue-500 rounded-lg px-6 py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold">Crear primera cuenta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {accounts.map((cuenta) => (
                <CuentaCard
                  key={cuenta.id}
                  cuenta={cuenta}
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
          )}
        </View>

        {/* KPIs Compactos - Dashboard */}
        <View className="px-6 mb-4">
          <View className="flex-row gap-3">
            {(() => {
              // Calcular ingresos y gastos del mes actual
              const hoy = new Date();
              const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
              const transaccionesMes = allTransactions.filter(t => {
                const fecha = new Date(t.fecha);
                return fecha >= inicioMes;
              });

              const ingresosMes = transaccionesMes
                .filter(t => t.tipo === 'income')
                .reduce((sum, t) => sum + t.monto, 0);

              const gastosMes = transaccionesMes
                .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
                .reduce((sum, t) => sum + t.monto, 0);

              const balanceMes = ingresosMes - gastosMes;

              // Calcular cambio vs mes anterior (simplificado)
              const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
              const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
              const transaccionesMesAnterior = allTransactions.filter(t => {
                const fecha = new Date(t.fecha);
                return fecha >= mesAnterior && fecha <= finMesAnterior;
              });

              const balanceMesAnterior = transaccionesMesAnterior
                .filter(t => t.tipo === 'income')
                .reduce((sum, t) => sum + t.monto, 0) -
                transaccionesMesAnterior
                .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
                .reduce((sum, t) => sum + t.monto, 0);

              const cambioPorcentaje = balanceMesAnterior !== 0
                ? ((balanceMes - balanceMesAnterior) / Math.abs(balanceMesAnterior)) * 100
                : 0;

              return (
                <>
                  <View className="flex-1">
                    <KPICard
                      titulo="Balance Total"
                      valor={`$${balanceTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                      icono="wallet"
                      colorTema={balanceTotal >= 0 ? 'green' : 'red'}
                      cambio={cambioPorcentaje}
                    />
                  </View>
                  <View className="flex-1">
                    <KPICard
                      titulo="Este Mes"
                      valor={`$${balanceMes.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                      icono="calendar-month"
                      colorTema={balanceMes >= 0 ? 'cyan' : 'red'}
                      subtitulo={`${ingresosMes > 0 ? '+' : ''}${Math.round(ingresosMes).toLocaleString()} / -${Math.round(gastosMes).toLocaleString()}`}
                    />
                  </View>
                </>
              );
            })()}
          </View>
        </View>

        {/* Gráfico de Balance */}
        <View className="px-6">
          <GraficoBalance balance={balanceTotal} transacciones={allTransactions} onPressShowMore={onPressCharts} />
        </View>

        {/* Transacciones recientes */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">
              Transacciones recientes
            </Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#737373" />
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View className="bg-neutral-900 rounded-2xl p-6 items-center">
              <MaterialCommunityIcons name="receipt-text-outline" size={48} color="#9CA3AF" />
              <Text className="text-neutral-400 text-center mt-3">
                No hay transacciones registradas
              </Text>
              <Text className="text-neutral-500 text-center text-sm mt-2">
                Agrega tu primera transacción usando el botón +
              </Text>
            </View>
          ) : (
            transactions.map((transaccion) => (
              <TransaccionItem
                key={transaccion.id}
                transaccion={transaccion}
                onPress={() => setSelectedTx(transaccion)}
              />
            ))
          )}
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