import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CartesianChart, BarGroup, Line } from 'victory-native';
import Svg, { Path } from 'react-native-svg';
import { cargarTransaccionesDesdeArchivo, Transaccion } from '../utils/lectorCsv';
import { filtrarPorRangoFecha, FiltroRango } from '../utils/filtrosFecha';
import { agruparPorCategoria, obtenerTendenciaMensual } from '../utils/agregaciones';

// crear paths de pie chart
function createPieSlicePath(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
  const x1 = centerX + radius * Math.cos(startAngle);
  const y1 = centerY + radius * Math.sin(startAngle);
  const x2 = centerX + radius * Math.cos(endAngle);
  const y2 = centerY + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function ChartsScreen() {
  // estado para el filtro seleccionado
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<FiltroRango>('año');

  // estado para todas las transacciones
  const [todasLasTransacciones, setTodasLasTransacciones] = useState<Transaccion[]>([]);

  // estado de carga
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

  // preparar datos para gráficos
  const prepararDatos = () => {
    if (todasLasTransacciones.length === 0) return null;

    const transaccionesFiltradas = filtrarPorRangoFecha(todasLasTransacciones, filtroSeleccionado);
    const categorias = agruparPorCategoria(transaccionesFiltradas);
    const tendencia = obtenerTendenciaMensual(todasLasTransacciones);
    const ultimos6Meses = tendencia.slice(-6);

    const datosTendencia = ultimos6Meses.map(d => ({
      mes: d.mes.substring(5),
      ingresos: d.ingresos / 1000,
      gastos: d.gastos / 1000,
    }));

    return {
      categorias: categorias,
      tendencia: datosTendencia,
    };
  };

  const datos = prepararDatos();

  // mostrar indicador de carga
  if (cargando) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Cargando gráficos...</Text>
      </View>
    );
  }

  // si no hay datos
  if (!datos || datos.categorias.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">No hay datos suficientes para mostrar gráficos</Text>
      </View>
    );
  }

  const colores = [
    '#EF4444', // Rojo
    '#F59E0B', // Naranja
    '#10B981', // Verde
    '#3B82F6', // Azul
    '#8B5CF6', // Púrpura
    '#EC4899', // Rosa
    '#14B8A6', // Teal
    '#F97316', // Naranja oscuro
    '#06B6D4', // Cyan
    '#A855F7', // Púrpura claro
    '#84CC16', // Lima
    '#F43F5E', // Rosa rojo
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="bg-white pt-12 pb-6 px-5 shadow-sm">
        <Text className="text-3xl font-bold text-gray-800">
          Gráficos
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          Visualización de tus finanzas
        </Text>
      </View>

      {/* FILTROS */}
      <View className="bg-white px-5 py-4 mb-4">
        <Text className="text-xs text-gray-500 mb-3 uppercase font-semibold">
          Período
        </Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => setFiltroSeleccionado('semana')}
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
            onPress={() => setFiltroSeleccionado('mes')}
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
            onPress={() => setFiltroSeleccionado('año')}
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

      <View className="bg-white mx-5 mb-4 rounded-2xl p-5 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-2">
          Distribución de Gastos
        </Text>
        <Text className="text-xs text-gray-500 mb-4">
          Por categoría ({filtroSeleccionado === 'semana' ? 'Esta semana' : filtroSeleccionado === 'mes' ? 'Este mes' : 'Este año'})
        </Text>

        <View style={{ height: 250 }} className="items-center justify-center">
          <Svg width={250} height={250} viewBox="0 0 250 250">
            {(() => {
              const centerX = 125;
              const centerY = 125;
              const radius = 100;
              const total = datos.categorias.reduce((sum, cat) => sum + cat.monto, 0);
              let currentAngle = -Math.PI / 2;

              return datos.categorias.map((cat, index) => {
                const sliceAngle = (cat.monto / total) * 2 * Math.PI;
                const startAngle = currentAngle;
                const endAngle = currentAngle + sliceAngle;
                const path = createPieSlicePath(centerX, centerY, radius, startAngle, endAngle);
                currentAngle = endAngle;

                return (
                  <Path
                    key={index}
                    d={path}
                    fill={colores[index % colores.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              });
            })()}
          </Svg>
        </View>

        <View className="mt-4">
          {datos.categorias.map((cat, index) => (
            <View key={index} className={`flex-row justify-between items-center py-2 ${index < datos.categorias.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <View className="flex-row items-center flex-1">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colores[index % colores.length] }}
                />
                <Text className="text-xs font-semibold text-gray-800">
                  {cat.categoria}
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-800">
                ${cat.monto.toLocaleString('es-CO')} ({cat.porcentaje}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* GRÁFICO DE LÍNEAS - Tendencia Mensual */}
      <View className="bg-white mx-5 mb-4 rounded-2xl p-5 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-2">
          Tendencia Mensual
        </Text>
        <Text className="text-xs text-gray-500 mb-4">
          Ingresos vs Gastos (últimos 6 meses)
        </Text>

        <View style={{ height: 300 }}>
          <CartesianChart
            data={datos.tendencia}
            xKey="mes"
            yKeys={["ingresos", "gastos"]}
            axisOptions={{
              tickCount: 5,
              labelOffset: { x: 0, y: 4 },
              labelColor: '#6B7280',
              lineColor: '#E5E7EB',
              lineWidth: 1,
            }}
            yAxis={[
              {
                formatYLabel: (value) => `$${(value / 1).toFixed(0)}K`,
              },
            ]}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.ingresos}
                  color="#10B981"
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 300 }}
                />
                <Line
                  points={points.gastos}
                  color="#EF4444"
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 300 }}
                />
              </>
            )}
          </CartesianChart>
        </View>

        {/* Leyenda */}
        <View className="flex-row justify-center mt-4">
          <View className="flex-row items-center mr-6">
            <View className="w-4 h-4 bg-green-500 rounded mr-2" />
            <Text className="text-xs text-gray-600">Ingresos</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-red-500 rounded mr-2" />
            <Text className="text-xs text-gray-600">Gastos</Text>
          </View>
        </View>
      </View>

      {/* GRÁFICO DE BARRAS AGRUPADAS - Comparación Mensual */}
      <View className="bg-white mx-5 mb-4 rounded-2xl p-5 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-2">
          Comparación Mensual
        </Text>
        <Text className="text-xs text-gray-500 mb-4">
          Ingresos vs Gastos por mes
        </Text>

        <View style={{ height: 300 }}>
          <CartesianChart
            data={datos.tendencia}
            xKey="mes"
            yKeys={["ingresos", "gastos"]}
            axisOptions={{
              tickCount: 5,
              labelOffset: { x: 0, y: 4 },
              labelColor: '#6B7280',
              lineColor: '#E5E7EB',
              lineWidth: 1,
            }}
            yAxis={[
              {
                formatYLabel: (value) => `$${(value / 1).toFixed(0)}K`,
              },
            ]}
          >
            {({ points, chartBounds }) => (
              <BarGroup
                chartBounds={chartBounds}
                betweenGroupPadding={0.2}
                withinGroupPadding={0.05}
              >
                <BarGroup.Bar
                  points={points.ingresos}
                  color="#10B981"
                  animate={{ type: "timing", duration: 300 }}
                />
                <BarGroup.Bar
                  points={points.gastos}
                  color="#EF4444"
                  animate={{ type: "timing", duration: 300 }}
                />
              </BarGroup>
            )}
          </CartesianChart>
        </View>

        <View className="flex-row justify-center mt-4">
          <View className="flex-row items-center mr-6">
            <View className="w-4 h-4 bg-green-500 rounded mr-2" />
            <Text className="text-xs text-gray-600">Ingresos</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-red-500 rounded mr-2" />
            <Text className="text-xs text-gray-600">Gastos</Text>
          </View>
        </View>

        <View className="mt-4 border-t border-gray-200 pt-4">
          <Text className="text-xs font-bold text-gray-700 mb-3">Valores por mes:</Text>
          {datos.tendencia.map((dato, index) => (
            <View key={index} className={`flex-row justify-between items-center py-2 ${index < datos.tendencia.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Text className="text-xs font-semibold text-gray-700 w-12">
                Mes {dato.mes}
              </Text>
              <View className="flex-1 flex-row justify-around">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  <Text className="text-xs text-gray-600">
                    ${(dato.ingresos * 1000).toLocaleString('es-CO')}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                  <Text className="text-xs text-gray-600">
                    ${(dato.gastos * 1000).toLocaleString('es-CO')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}
