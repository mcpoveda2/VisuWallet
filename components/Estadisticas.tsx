import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { db } from '../utils/firebase.js';
import { Transaccion } from '../types';
import {
  filtrarPorRangoFecha,
  obtenerPeriodoAnterior,
  obtenerTextoRango,
  irAPeriodoAnterior,
  irAPeriodoSiguiente,
  FiltroRango
} from '../utils/filtrosFecha';
import { obtenerResumenFinanciero, ResumenFinanciero } from '../utils/agregaciones';
import NavBar from './NavBar';

interface EstadisticasProps {
  onBack?: () => void;
  onPressAdd?: () => void;
  onPressHome?: () => void;
  onPressCharts?: () => void;
}

interface TransaccionConCuenta extends Transaccion {
  account?: string;
  accountId?: string;
}

interface CuentaFirestore {
  id: string;
  tipo: string;
  numero: string;
  saldo: number;
  cedula: string;
  propietario: string;
  email: string;
}

export default function Estadisticas({ onBack, onPressAdd, onPressHome, onPressCharts }: EstadisticasProps) {
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<FiltroRango>('mes');
  const [fechaReferencia, setFechaReferencia] = useState<Date>(new Date());
  const [todasLasTransacciones, setTodasLasTransacciones] = useState<TransaccionConCuenta[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFirestore[]>([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaFirestore | null>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [datos, setDatos] = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);

  // cargar cuentas y transacciones al montar el componente
  useEffect(() => {
    async function cargarTodo() {
      try {
        setCargando(true);

        // Cargar cuentas
        const snapCuentas = await getDocs(collection(db, 'cuentas'));
        const cuentasData = snapCuentas.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            tipo: data.tipo || 'corriente',
            numero: data.numero || '',
            saldo: data.saldo ? Number(data.saldo) : 0,
            cedula: data.cedula || '',
            propietario: data.propietario || data.titular || '',
            email: data.email || '',
          } as CuentaFirestore;
        });
        cuentasData.sort((a, b) =>
          (a.propietario || '').localeCompare(b.propietario || '') ||
          (a.numero || '').localeCompare(b.numero || '')
        );
        setCuentas(cuentasData);

        // Cargar transacciones (patrón de Home.tsx)
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
            accountId: data.accountId ?? '',
          } as TransaccionConCuenta;
        });

        // Ordenar por fecha descendente
        docs.sort((a, b) => {
          const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
          const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
          return tb - ta;
        });

        setTodasLasTransacciones(docs);
      } catch (error) {
        console.warn('Error cargando datos:', error);
        setTodasLasTransacciones([]);
        setCuentas([]);
      } finally {
        setCargando(false);
      }
    }

    cargarTodo();
  }, []);

  // recalcular datos cuando cambie el filtro, fecha de referencia, cuenta o transacciones
  useEffect(() => {
    if (todasLasTransacciones.length > 0) {
      // Filtrar por cuenta si hay una seleccionada
      let transaccionesFiltradas = todasLasTransacciones;

      if (cuentaSeleccionada) {
        transaccionesFiltradas = todasLasTransacciones.filter(t => {
          // Intentar filtrar por accountId primero (más preciso)
          if (t.accountId && cuentaSeleccionada.numero) {
            return t.accountId === cuentaSeleccionada.numero;
          }
          // Fallback: filtrar por account string (menos preciso)
          if (t.account) {
            return t.account.includes(cuentaSeleccionada.numero || '') ||
                   t.account.includes(cuentaSeleccionada.propietario || '');
          }
          return false;
        });

        console.log('[Estadisticas] Cuenta seleccionada:', cuentaSeleccionada.propietario, cuentaSeleccionada.numero);
        console.log('[Estadisticas] Transacciones filtradas por cuenta:', transaccionesFiltradas.length);
      }

      const transaccionesActuales = filtrarPorRangoFecha(transaccionesFiltradas, filtroSeleccionado, fechaReferencia);
      const transaccionesAnteriores = obtenerPeriodoAnterior(transaccionesFiltradas, filtroSeleccionado, fechaReferencia);

      console.log('[Estadisticas] Periodo:', filtroSeleccionado, 'Fecha ref:', fechaReferencia.toLocaleDateString());
      console.log('[Estadisticas] Transacciones del periodo actual:', transaccionesActuales.length);
      if (transaccionesActuales.length > 0) {
        console.log('[Estadisticas] Primera transacción del periodo:', transaccionesActuales[0]);
      }

      const resumen = obtenerResumenFinanciero(transaccionesActuales, transaccionesAnteriores, transaccionesFiltradas);

      setDatos(resumen);
    }
  }, [filtroSeleccionado, fechaReferencia, todasLasTransacciones, cuentaSeleccionada]);

  const navegarAtras = () => {
    setFechaReferencia(irAPeriodoAnterior(filtroSeleccionado, fechaReferencia));
  };

  const navegarAdelante = () => {
    setFechaReferencia(irAPeriodoSiguiente(filtroSeleccionado, fechaReferencia));
  };

  const cambiarFiltro = (nuevoFiltro: FiltroRango) => {
    setFiltroSeleccionado(nuevoFiltro);
    setFechaReferencia(new Date());
  };

  const seleccionarCuenta = (cuenta: CuentaFirestore | null) => {
    setCuentaSeleccionada(cuenta);
    setShowAccountSelector(false);
  };

  const obtenerNombreCuentaSeleccionada = () => {
    if (!cuentaSeleccionada) return 'Todas las cuentas';
    return cuentaSeleccionada.propietario
      ? `${cuentaSeleccionada.propietario} — ${cuentaSeleccionada.numero}`
      : cuentaSeleccionada.numero || 'Cuenta';
  };

  if (cargando) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-neutral-400 mt-4">Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!datos) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-400">No hay datos disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" style={{ paddingBottom: 90 }}>
        {/* Header */}
        <View className="bg-neutral-900 pt-6 pb-6 px-5">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="mb-4 flex-row items-center"
            >
              <Text className="text-blue-500 text-lg font-semibold">← Volver</Text>
            </TouchableOpacity>
          )}
          <Text className="text-3xl font-bold text-white">
            Reporte
          </Text>
        </View>

        {/* Selector de Cuenta */}
        <View className="bg-neutral-900 px-5 py-4 mb-4 mt-2">
          <Text className="text-xs text-neutral-400 mb-3 uppercase font-semibold">
            Cuenta
          </Text>
          <TouchableOpacity
            onPress={() => setShowAccountSelector(true)}
            className="bg-neutral-800 rounded-lg px-4 py-3 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-white font-medium" numberOfLines={1}>
                {obtenerNombreCuentaSeleccionada()}
              </Text>
              {cuentaSeleccionada && (
                <Text className="text-neutral-400 text-xs mt-1">
                  Balance: ${cuentaSeleccionada.saldo.toFixed(2)}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#737373" />
          </TouchableOpacity>
        </View>

        {/* Selector de Período */}
        <View className="bg-neutral-900 px-5 py-4 mb-4">
          <Text className="text-xs text-neutral-400 mb-3 uppercase font-semibold">
            Período
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={navegarAtras}
              className="bg-neutral-800 p-2 rounded-lg"
            >
              <Text className="text-white font-bold text-lg">←</Text>
            </TouchableOpacity>

            <Text className="text-sm text-white font-semibold flex-1 text-center">
              {obtenerTextoRango(filtroSeleccionado, fechaReferencia)}
            </Text>

            <TouchableOpacity
              onPress={navegarAdelante}
              className="bg-neutral-800 p-2 rounded-lg"
            >
              <Text className="text-white font-bold text-lg">→</Text>
            </TouchableOpacity>
          </View>

          {/* Botones de filtro */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => cambiarFiltro('semana')}
              className={`flex-1 py-3 rounded-lg mr-2 ${
                filtroSeleccionado === 'semana'
                  ? 'bg-blue-500'
                  : 'bg-neutral-800'
              }`}
            >
              <Text className={`text-center font-semibold ${
                filtroSeleccionado === 'semana'
                  ? 'text-white'
                  : 'text-neutral-400'
              }`}>
                Semana
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => cambiarFiltro('mes')}
              className={`flex-1 py-3 rounded-lg mr-2 ${
                filtroSeleccionado === 'mes'
                  ? 'bg-blue-500'
                  : 'bg-neutral-800'
              }`}
            >
              <Text className={`text-center font-semibold ${
                filtroSeleccionado === 'mes'
                  ? 'text-white'
                  : 'text-neutral-400'
              }`}>
                Mes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => cambiarFiltro('año')}
              className={`flex-1 py-3 rounded-lg ${
                filtroSeleccionado === 'año'
                  ? 'bg-blue-500'
                  : 'bg-neutral-800'
              }`}
            >
              <Text className={`text-center font-semibold ${
                filtroSeleccionado === 'año'
                  ? 'text-white'
                  : 'text-neutral-400'
              }`}>
                Año
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjetas de Resumen */}
        <View className="px-5 mb-6">
          {/* Balance del Periodo */}
          <View className="bg-neutral-900 p-5 rounded-2xl mb-3">
            <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
              Balance del Periodo
            </Text>
            <Text className="text-4xl font-bold text-white">
              ${datos.balance.toLocaleString('es-CO')}
            </Text>
            {cuentaSeleccionada && (
              <Text className="text-xs text-neutral-400 mt-1">
                Cuenta: {cuentaSeleccionada.propietario}
              </Text>
            )}
          </View>

          {/* Gastos e Ingresos */}
          <View className="flex-row mb-3">
            <View className="flex-1 bg-neutral-900 p-4 rounded-2xl mr-2 border border-red-900">
              <Text className="text-xs text-red-400 uppercase font-semibold mb-1">
                Gastos
              </Text>
              <Text className="text-2xl font-bold text-red-500">
                ${datos.gastos.toLocaleString('es-CO')}
              </Text>
            </View>

            <View className="flex-1 bg-neutral-900 p-4 rounded-2xl ml-2 border border-green-900">
              <Text className="text-xs text-green-400 uppercase font-semibold mb-1">
                Ingresos
              </Text>
              <Text className="text-2xl font-bold text-green-500">
                ${datos.ingresos.toLocaleString('es-CO')}
              </Text>
            </View>
          </View>

          {/* Flujo de Efectivo */}
          <View className="bg-neutral-900 p-5 rounded-2xl border border-blue-900">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs text-blue-400 uppercase font-semibold">
                Flujo de Efectivo
              </Text>
              <View className={`px-3 py-1 rounded-full ${
                datos.porcentajeCambio >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Text className="text-xs text-white font-bold">
                  {datos.porcentajeCambio >= 0 ? '+' : ''}{datos.porcentajeCambio}%
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-blue-500">
              ${datos.flujoEfectivo.toLocaleString('es-CO')}
            </Text>
            <Text className="text-xs text-neutral-400 mt-2">
              vs. {filtroSeleccionado} anterior
            </Text>
          </View>
        </View>

        {/* Top Gastos */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-white mb-4">
            Top Gastos
          </Text>
          {datos.topGastos.length > 0 ? (
            <View className="bg-neutral-900 rounded-2xl p-4">
              {datos.topGastos.map((gasto, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between items-center py-3 ${
                    index < datos.topGastos.length - 1
                      ? 'border-b border-neutral-800'
                      : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-white">
                      {gasto.categoria}
                    </Text>
                    <View className="bg-neutral-800 h-2 rounded-full mt-2 overflow-hidden">
                      <View
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${gasto.porcentaje}%` }}
                      />
                    </View>
                  </View>
                  <View className="ml-4 items-end">
                    <Text className="text-base font-bold text-white">
                      ${gasto.monto.toLocaleString('es-CO')}
                    </Text>
                    <Text className="text-xs text-neutral-400">
                      {gasto.porcentaje}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay gastos en este período
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Selector de Cuenta */}
      <Modal visible={showAccountSelector} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="w-full bg-neutral-900 rounded-lg p-4 max-h-[70vh]">
            <Text className="text-white text-lg font-semibold mb-3">
              Seleccionar cuenta
            </Text>

            <ScrollView>
              {/* Opción: Todas las cuentas */}
              <TouchableOpacity
                onPress={() => seleccionarCuenta(null)}
                className={`py-3 px-3 rounded-lg mb-2 ${
                  !cuentaSeleccionada ? 'bg-blue-500/20 border border-blue-500' : 'border border-neutral-800'
                }`}
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="bank-outline"
                    size={24}
                    color={!cuentaSeleccionada ? '#3B82F6' : '#737373'}
                  />
                  <Text className={`ml-3 font-medium ${
                    !cuentaSeleccionada ? 'text-blue-500' : 'text-white'
                  }`}>
                    Todas las cuentas
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Lista de cuentas */}
              {cuentas.length === 0 ? (
                <Text className="text-neutral-400 text-center py-4">
                  No hay cuentas registradas.
                </Text>
              ) : (
                cuentas.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => seleccionarCuenta(c)}
                    className={`py-3 px-3 rounded-lg mb-2 ${
                      cuentaSeleccionada?.id === c.id
                        ? 'bg-blue-500/20 border border-blue-500'
                        : 'border border-neutral-800'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons
                            name="bank"
                            size={20}
                            color={cuentaSeleccionada?.id === c.id ? '#3B82F6' : '#737373'}
                          />
                          <Text className={`ml-2 font-medium ${
                            cuentaSeleccionada?.id === c.id ? 'text-blue-500' : 'text-white'
                          }`}>
                            {c.propietario || 'Cuenta'}
                          </Text>
                          <Text className="text-neutral-400 text-xs ml-2">
                            {c.tipo ? c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1) : ''}
                          </Text>
                        </View>
                        <Text className="text-neutral-400 text-sm mt-1 ml-7">
                          {c.numero}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className={`font-bold ${
                          cuentaSeleccionada?.id === c.id ? 'text-blue-500' : 'text-white'
                        }`}>
                          ${c.saldo.toFixed(2)}
                        </Text>
                        {c.cedula && (
                          <Text className="text-neutral-400 text-xs">
                            {c.cedula}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View className="flex-row justify-end mt-4 pt-4 border-t border-neutral-800">
              <TouchableOpacity
                onPress={() => setShowAccountSelector(false)}
                className="px-4 py-2"
              >
                <Text className="text-sky-400 font-semibold">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NavBar */}
      {onPressAdd && (
        <NavBar
          onPressAdd={onPressAdd}
          onPressHome={onPressHome}
          onPressEstadisticas={() => {}}
          onPressCharts={onPressCharts}
          activeScreen="estadisticas"
        />
      )}
    </SafeAreaView>
  );
}
