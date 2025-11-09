import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { cargarTransaccionesDesdeArchivo, Transaccion } from '../utils/lectorCsv';
import { filtrarPorRangoFecha, obtenerPeriodoAnterior, obtenerTextoRango, irAPeriodoAnterior, irAPeriodoSiguiente, FiltroRango } from '../utils/filtrosFecha';
import { obtenerResumenFinanciero, ResumenFinanciero } from '../utils/agregaciones';

export default function StatisticsScreen() {
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<FiltroRango>('mes');
  const [fechaReferencia, setFechaReferencia] = useState<Date>(new Date());
  const [todasLasTransacciones, setTodasLasTransacciones] = useState<Transaccion[]>([]);
  const [datos, setDatos] = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);

  // cargar transacciones al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        const transacciones = await cargarTransaccionesDesdeArchivo();
        setTodasLasTransacciones(transacciones);
      } catch (error) {
        console.error('Error cargando transacciones:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // recalcular datos cuando cambie el filtro, fecha de referencia o las transacciones
  useEffect(() => {
    if (todasLasTransacciones.length > 0) {
      const transaccionesActuales = filtrarPorRangoFecha(todasLasTransacciones, filtroSeleccionado, fechaReferencia);
      const transaccionesAnteriores = obtenerPeriodoAnterior(todasLasTransacciones, filtroSeleccionado, fechaReferencia);
      const resumen = obtenerResumenFinanciero(transaccionesActuales, transaccionesAnteriores, todasLasTransacciones);

      setDatos(resumen);
    }
  }, [filtroSeleccionado, fechaReferencia, todasLasTransacciones]);

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
  if (cargando) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Cargando datos...</Text>
      </View>
    );
  }

  if (!datos) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">No hay datos disponibles</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-6 px-5 shadow-sm">
        <Text className="text-3xl font-bold text-gray-800">
          Estadísticas
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {todasLasTransacciones.length} transacciones totales
        </Text>
      </View>

      <View className="bg-white px-5 py-4 mb-4">
        <Text className="text-xs text-gray-500 mb-3 uppercase font-semibold">
          Período
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={navegarAtras}
            className="bg-gray-100 p-2 rounded-lg"
          >
            <Text className="text-gray-700 font-bold text-lg">←</Text>
          </TouchableOpacity>

          <Text className="text-sm text-gray-700 font-semibold flex-1 text-center">
            {obtenerTextoRango(filtroSeleccionado, fechaReferencia)}
          </Text>

          <TouchableOpacity
            onPress={navegarAdelante}
            className="bg-gray-100 p-2 rounded-lg"
          >
            <Text className="text-gray-700 font-bold text-lg">→</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => cambiarFiltro('semana')}
            className={`flex-1 py-3 rounded-lg mr-2 ${
              filtroSeleccionado === 'semana'
                ? 'bg-blue-500'
                : 'bg-gray-100'
            }`}
          >
            <Text className={`text-center font-semibold ${
              filtroSeleccionado === 'semana'
                ? 'text-white'
                : 'text-gray-600'
            }`}>
              Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => cambiarFiltro('mes')}
            className={`flex-1 py-3 rounded-lg mr-2 ${
              filtroSeleccionado === 'mes'
                ? 'bg-blue-500'
                : 'bg-gray-100'
            }`}
          >
            <Text className={`text-center font-semibold ${
              filtroSeleccionado === 'mes'
                ? 'text-white'
                : 'text-gray-600'
            }`}>
              Mes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => cambiarFiltro('año')}
            className={`flex-1 py-3 rounded-lg ${
              filtroSeleccionado === 'año'
                ? 'bg-blue-500'
                : 'bg-gray-100'
            }`}
          >
            <Text className={`text-center font-semibold ${
              filtroSeleccionado === 'año'
                ? 'text-white'
                : 'text-gray-600'
            }`}>
              Año
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 mb-6">
        <View className="bg-white p-5 rounded-2xl mb-3 shadow-sm">
          <Text className="text-xs text-gray-500 uppercase font-semibold mb-1">
            Balance
          </Text>
          <Text className="text-4xl font-bold text-gray-800">
            ${datos.balance.toLocaleString('es-CO')}
          </Text>
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 bg-red-50 p-4 rounded-2xl mr-2 border border-red-100">
            <Text className="text-xs text-red-600 uppercase font-semibold mb-1">
              Gastos
            </Text>
            <Text className="text-2xl font-bold text-red-700">
              ${datos.gastos.toLocaleString('es-CO')}
            </Text>
          </View>

          <View className="flex-1 bg-green-50 p-4 rounded-2xl ml-2 border border-green-100">
            <Text className="text-xs text-green-600 uppercase font-semibold mb-1">
              Ingresos
            </Text>
            <Text className="text-2xl font-bold text-green-700">
              ${datos.ingresos.toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        <View className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs text-blue-600 uppercase font-semibold">
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
          <Text className="text-3xl font-bold text-blue-700">
            ${datos.flujoEfectivo.toLocaleString('es-CO')}
          </Text>
          <Text className="text-xs text-gray-500 mt-2">
            vs. {filtroSeleccionado} anterior
          </Text>
        </View>
      </View>

      <View className="px-5 mb-8">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Top Gastos
        </Text>
        {datos.topGastos.length > 0 ? (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {datos.topGastos.map((gasto, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-center py-3 ${
                  index < datos.topGastos.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    {gasto.categoria}
                  </Text>
                  <View className="bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                    <View
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${gasto.porcentaje}%` }}
                    />
                  </View>
                </View>
                <View className="ml-4 items-end">
                  <Text className="text-base font-bold text-gray-800">
                    ${gasto.monto.toLocaleString('es-CO')}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {gasto.porcentaje}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-center text-gray-500">
              No hay gastos en este período
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
