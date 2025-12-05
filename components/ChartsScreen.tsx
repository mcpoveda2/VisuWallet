import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CartesianChart, Bar, Line, Area } from 'victory-native';
import { db } from '../utils/firebase.js';
import { Transaccion } from '../types';
import {
  filtrarPorRangoFecha,
  obtenerTextoRango,
  irAPeriodoAnterior,
  irAPeriodoSiguiente,
  FiltroRango
} from '../utils/filtrosFecha';
import {
  agruparPorCategoria,
  obtenerTendenciaMensual,
  obtenerTendenciaAnual,
  obtenerTendenciaSemestral,
  formatearMonedaAdaptiva,
  calcularDominioY,
  calcularTasaAhorro,
  calcularGastoPromedioDiario,
  calcularIngresos,
  calcularGastos,
  obtenerMejorPeorCategoria
} from '../utils/agregaciones';
import GraficosPastel from './GraficosPastel';
import GraficoBarrasHorizontales from './GraficoBarrasHorizontales';
import GraficoBarrasSemanal from './GraficoBarrasSemanal';
import GraficoEvolucionCuenta from './GraficoEvolucionCuenta';
import KPICard from './KPICard';
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

        // Cargar transacciones
        const snap = await getDocs(collection(db, 'transacciones'));
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

    // Datos para gráfico de tendencia - varía según el filtro
    let tendenciaRaw;
    if (filtroSeleccionado === 'año') {
      tendenciaRaw = obtenerTendenciaAnual(transaccionesFiltradas);
    } else {
      tendenciaRaw = obtenerTendenciaSemestral(transaccionesFiltradas);
    }

    // Preparar datos para CartesianChart
    const tendenciaDataIngresos: Array<{x: number; ingresos: number; gastos: number}> = tendenciaRaw.map((item, index) => ({
      x: index + 1,
      ingresos: item.ingresos,
      gastos: item.gastos
    }));

    return {
      categorias,
      tendenciaRaw,
      tendenciaDataIngresos,
      transaccionesActuales,
      transaccionesFiltradas
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
            Gráficos
          </Text>
        </View>

        {/* Selector de Cuenta */}
        <View className="bg-neutral-900 px-5 py-4">
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

        {/* Gráfico de Evolución de Cuenta (solo cuando hay cuenta seleccionada) */}
        {cuentaSeleccionada && (
          <GraficoEvolucionCuenta
            transacciones={datos.transaccionesFiltradas}
            saldoActual={cuentaSeleccionada.saldo}
            nombreCuenta={obtenerNombreCuentaSeleccionada()}
          />
        )}

        {/* Selector de Período */}
        <View className="bg-neutral-900 px-5 py-4">
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
        <View className="px-5 mb-6 mt-4">
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

        {/* Gráfico de Barras Semanal - Solo se muestra cuando el filtro es "semana" */}
        {filtroSeleccionado === 'semana' && (
          <View className="px-5 mb-6">
            <GraficoBarrasSemanal transacciones={datos.transaccionesFiltradas} />
          </View>
        )}

        {/* Gráfico de Distribución por Categoría - Barras Horizontales (Comparación) */}
        <View className="px-5 mb-6">
          {datos.categorias.length > 0 ? (
            <GraficoBarrasHorizontales
              titulo="Top 5 - Comparación Rápida"
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
              limite={5}
            />
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay datos para mostrar
              </Text>
            </View>
          )}
        </View>

        {/* Gráfico de Tendencia - Líneas Suaves */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">
            {filtroSeleccionado === 'año' ? 'Tendencia Anual' : 'Tendencia Últimos 6 Meses'}
          </Text>
          {datos.tendenciaRaw.length > 0 ? (
            (() => {
              // Calcular dominio Y adaptivo para tendencia
              const todosLosValores = [...datos.tendenciaDataIngresos.map((d: any) => d.ingresos), ...datos.tendenciaDataIngresos.map((d: any) => d.gastos)];
              const [minYTendencia, maxYTendencia] = calcularDominioY(todosLosValores, 0.15);

              // Calcular promedios
              const promedioIngresos = datos.tendenciaRaw.reduce((s: number, m: any) => s + m.ingresos, 0) / datos.tendenciaRaw.length;
              const promedioGastos = datos.tendenciaRaw.reduce((s: number, m: any) => s + m.gastos, 0) / datos.tendenciaRaw.length;

              return (
                <View className="bg-neutral-900 rounded-2xl p-4">
                  {/* Indicadores de promedio */}
                  <View className="flex-row justify-around mb-3 bg-neutral-800 rounded-lg p-3">
                    <View className="items-center">
                      <Text className="text-neutral-400 text-xs mb-1">Promedio Ingresos</Text>
                      <Text className="text-green-500 font-bold text-sm">
                        ${Math.round(promedioIngresos).toLocaleString('es-CO')}
                      </Text>
                    </View>
                    <View className="w-px bg-neutral-700" />
                    <View className="items-center">
                      <Text className="text-neutral-400 text-xs mb-1">Promedio Gastos</Text>
                      <Text className="text-red-500 font-bold text-sm">
                        ${Math.round(promedioGastos).toLocaleString('es-CO')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 240 }}>
                    <CartesianChart
                      data={datos.tendenciaDataIngresos}
                      xKey="x"
                      yKeys={['ingresos', 'gastos'] as const}
                      domainPadding={{ top: 20, bottom: 20 }}
                      domain={{ y: [minYTendencia, maxYTendencia] }}
                      axisOptions={{
                        formatXLabel: (value: any) => {
                          const index = Math.floor(value) - 1;
                          if (index >= 0 && index < datos.tendenciaRaw.length) {
                            return datos.tendenciaRaw[index].mesNombre || datos.tendenciaRaw[index].mes.split('-')[1];
                          }
                          return '';
                        },
                        formatYLabel: (value: any) => formatearMonedaAdaptiva(value, maxYTendencia)
                      }}
                    >
                      {({ points }: any) => (
                        <>
                          <Line
                            points={points.ingresos}
                            color="#22C55E"
                            strokeWidth={3}
                            curveType="natural"
                            animate={{ type: 'timing', duration: 300 }}
                          />
                          <Line
                            points={points.gastos}
                            color="#EF4444"
                            strokeWidth={3}
                            curveType="natural"
                            animate={{ type: 'timing', duration: 300 }}
                          />
                        </>
                      )}
                    </CartesianChart>
                  </View>

                  {/* Leyenda */}
                  <View className="flex-row justify-center gap-6 mt-3">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                      <Text className="text-xs text-neutral-400 font-medium">Ingresos</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                      <Text className="text-xs text-neutral-400 font-medium">Gastos</Text>
                    </View>
                  </View>
                </View>
              );
            })()
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay datos para mostrar
              </Text>
            </View>
          )}
        </View>

        {/* Gráfico de Balance Neto (Área) */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-white mb-4">
            Balance Neto del Período
          </Text>
          {datos.tendenciaRaw.length > 0 ? (
            (() => {
              // Calcular datos de balance y dominio Y adaptivo
              const balanceData = datos.tendenciaDataIngresos.map((item: any) => ({
                x: item.x,
                balance: item.ingresos - item.gastos
              }));
              const valoresBalance = balanceData.map((d: any) => d.balance);
              const [minYBalance, maxYBalance] = calcularDominioY(valoresBalance, 0.15);

              return (
                <View className="bg-neutral-900 rounded-2xl p-4">
                  <View style={{ height: 200 }}>
                    <CartesianChart
                      data={balanceData}
                      xKey="x"
                      yKeys={['balance'] as const}
                      domainPadding={{ top: 20, bottom: 20 }}
                      domain={{ y: [minYBalance, maxYBalance] }}
                      axisOptions={{
                        formatXLabel: (value: any) => {
                          const index = Math.floor(value) - 1;
                          if (index >= 0 && index < datos.tendenciaRaw.length) {
                            return datos.tendenciaRaw[index].mesNombre || datos.tendenciaRaw[index].mes.split('-')[1];
                          }
                          return '';
                        },
                        formatYLabel: (value: any) => formatearMonedaAdaptiva(value, maxYBalance)
                      }}
                    >
                      {({ points }: any) => (
                        <Area
                          points={points.balance}
                          y0={minYBalance}
                          color="#06B6D4"
                          curveType="natural"
                          animate={{ type: 'timing', duration: 300 }}
                        />
                      )}
                    </CartesianChart>
                  </View>

                  {/* Indicador */}
                  <View className="mt-3 flex-row justify-center">
                    <View className="bg-blue-500/20 border border-blue-500/40 rounded-lg px-4 py-2 flex-row items-center gap-2">
                      <View className="w-3 h-3 bg-blue-500 rounded-full" />
                      <Text className="text-blue-400 text-sm font-semibold">
                        Balance Neto: ${(datos.tendenciaRaw.reduce((s, m) => s + m.ingresos, 0) - datos.tendenciaRaw.reduce((s, m) => s + m.gastos, 0)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()
          ) : (
            <View className="bg-neutral-900 rounded-2xl p-6">
              <Text className="text-center text-neutral-400">
                No hay datos para mostrar
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
          onPressEstadisticas={onPressEstadisticas}
          onPressCharts={() => {}}
          activeScreen="charts"
        />
      )}
    </SafeAreaView>
  );
}
