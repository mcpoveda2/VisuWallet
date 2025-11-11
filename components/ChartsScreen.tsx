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
import { agruparPorCategoria, obtenerTendenciaMensual } from '../utils/agregaciones';
import GraficosPastel from './GraficosPastel';
import NavBar from './NavBar';

interface ChartsScreenProps {
  onBack?: () => void;
  onPressAdd?: () => void;
  onPressHome?: () => void;
  onPressEstadisticas?: () => void;
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

export default function ChartsScreen({ onBack, onPressAdd, onPressHome, onPressEstadisticas }: ChartsScreenProps) {
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<FiltroRango>('mes');
  const [fechaReferencia, setFechaReferencia] = useState<Date>(new Date());
  const [todasLasTransacciones, setTodasLasTransacciones] = useState<TransaccionConCuenta[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFirestore[]>([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaFirestore | null>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
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

  // Obtener datos para gráficos
  const obtenerDatosGraficos = () => {
    let transaccionesFiltradas = todasLasTransacciones;

    if (cuentaSeleccionada) {
      transaccionesFiltradas = todasLasTransacciones.filter(t => {
        if (t.accountId && cuentaSeleccionada.numero) {
          return t.accountId === cuentaSeleccionada.numero;
        }
        if (t.account) {
          return t.account.includes(cuentaSeleccionada.numero || '') ||
                 t.account.includes(cuentaSeleccionada.propietario || '');
        }
        return false;
      });
    }

    const transaccionesActuales = filtrarPorRangoFecha(transaccionesFiltradas, filtroSeleccionado, fechaReferencia);

    // Datos para gráfico de categorías
    const categorias = agruparPorCategoria(transaccionesActuales);

    // Datos para gráfico de tendencia mensual
    const tendencia = obtenerTendenciaMensual(transaccionesFiltradas).slice(-6);

    return {
      categorias,
      tendencia,
      transaccionesActuales
    };
  };

  const datos = obtenerDatosGraficos();

  if (cargando) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-neutral-400 mt-4">Cargando gráficos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black m-safe p-safe">
      <ScrollView className="flex-1 -mt-16" style={{ paddingBottom: 90 }}>
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
            Gráficos
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

        {/* Gráfico de Distribución por Categoría - Pastel */}
        <View className="px-5 mb-6">
          {datos.categorias.length > 0 ? (
            <GraficosPastel
              titulo="Gastos por Categoría"
              datos={datos.categorias.map((cat, index) => ({
                label: cat.categoria,
                value: cat.monto,
                color: [
                  '#EF4444',
                  '#F97316',
                  '#EAB308',
                  '#22C55E',
                  '#06B6D4',
                  '#EC4899',
                  '#8B5CF6',
                  '#06B6D4'
                ][index % 8],
                porcentaje: cat.porcentaje
              }))}
            />
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay datos para mostrar
              </Text>
            </View>
          )}
        </View>

        {/* Gráfico de Tendencia Mensual */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-white mb-4">
            Tendencia de Últimos 6 Meses
          </Text>
          {datos.tendencia.length > 0 ? (
            <View className="bg-neutral-900 rounded-2xl p-4">
              {datos.tendencia.map((mes, index) => {
                const maxMonto = Math.max(
                  ...datos.tendencia.map(m => Math.max(m.ingresos, m.gastos))
                );
                const heightIngresos = maxMonto > 0 ? (mes.ingresos / maxMonto) * 80 : 0;
                const heightGastos = maxMonto > 0 ? (mes.gastos / maxMonto) * 80 : 0;

                return (
                  <View key={index} className="mb-4">
                    <Text className="text-xs text-neutral-400 mb-2">
                      {mes.mes}
                    </Text>
                    <View className="flex-row items-end h-24 gap-2">
                      {/* Barra de Ingresos */}
                      <View className="flex-1 items-center">
                        <View
                          className="w-full bg-green-500 rounded-t"
                          style={{ height: `${heightIngresos || 8}px`, minHeight: 8 }}
                        />
                        <Text className="text-xs text-green-400 mt-1 text-center">
                          ${Math.round(mes.ingresos / 1000)}k
                        </Text>
                      </View>

                      {/* Barra de Gastos */}
                      <View className="flex-1 items-center">
                        <View
                          className="w-full bg-red-500 rounded-t"
                          style={{ height: `${heightGastos || 8}px`, minHeight: 8 }}
                        />
                        <Text className="text-xs text-red-400 mt-1 text-center">
                          ${Math.round(mes.gastos / 1000)}k
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              <View className="flex-row justify-center gap-4 mt-4 pt-4 border-t border-neutral-800">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-green-500 rounded mr-2" />
                  <Text className="text-xs text-neutral-400">Ingresos</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-red-500 rounded mr-2" />
                  <Text className="text-xs text-neutral-400">Gastos</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay datos para mostrar
              </Text>
            </View>
          )}
        </View>

        {/* Resumen de Transacciones */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-white mb-4">
            Resumen del Período
          </Text>
          <View className="bg-neutral-900 rounded-2xl p-4">
            <View className="flex-row mb-3">
              <View className="flex-1 bg-neutral-800 p-3 rounded-lg mr-2">
                <Text className="text-xs text-red-400 uppercase font-semibold mb-1">
                  Total Gastos
                </Text>
                <Text className="text-lg font-bold text-red-500">
                  ${datos.transaccionesActuales
                    .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
                    .reduce((sum, t) => sum + t.monto, 0)
                    .toLocaleString('es-CO')}
                </Text>
              </View>
              <View className="flex-1 bg-neutral-800 p-3 rounded-lg ml-2">
                <Text className="text-xs text-green-400 uppercase font-semibold mb-1">
                  Total Ingresos
                </Text>
                <Text className="text-lg font-bold text-green-500">
                  ${datos.transaccionesActuales
                    .filter(t => t.tipo === 'income')
                    .reduce((sum, t) => sum + t.monto, 0)
                    .toLocaleString('es-CO')}
                </Text>
              </View>
            </View>
            <View className="bg-neutral-800 p-3 rounded-lg">
              <Text className="text-xs text-blue-400 uppercase font-semibold mb-1">
                Transacciones
              </Text>
              <Text className="text-lg font-bold text-blue-500">
                {datos.transaccionesActuales.length}
              </Text>
            </View>
          </View>
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
          onPressEstadisticas={onPressEstadisticas}
          onPressCharts={() => {}}
          activeScreen="charts"
        />
      )}
    </SafeAreaView>
  );
}
