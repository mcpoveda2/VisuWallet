import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { BarChart } from 'react-native-gifted-charts';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Transaccion } from '../types';

interface GraficoBarrasSemanalProps {
  transacciones: Transaccion[];
}

export default function GraficoBarrasSemanal({ transacciones }: GraficoBarrasSemanalProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'income' | 'expense'>('income');

  // Calcular inicio y fin de la semana
  const calcularRangoSemana = (offset: number) => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - diasDesdeInicio + (offset * 7));
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    return { inicioSemana, finSemana };
  };

  // Formatear rango de fecha
  const formatearRangoFecha = (inicio: Date, fin: Date) => {
    const opciones: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const inicioStr = inicio.toLocaleDateString('es-ES', opciones);
    const finStr = fin.toLocaleDateString('es-ES', opciones);
    return `${inicioStr} - ${finStr}`;
  };

  const { inicioSemana, finSemana } = calcularRangoSemana(weekOffset);
  const rangoTexto = formatearRangoFecha(inicioSemana, finSemana);
  const añoActual = inicioSemana.getFullYear();

  // Generar datos para los 7 días de la semana
  const generarDatosSemana = () => {
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const diasCompletos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const datos = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const transaccionesDia = transacciones.filter(t => {
        if (!t.fecha) return false;
        const tFecha = new Date(t.fecha);
        return tFecha.toISOString().split('T')[0] === fechaStr;
      });

      const valor = transaccionesDia
        .filter(t => t.tipo === tipoSeleccionado)
        .reduce((sum, t) => sum + t.monto, 0);

      datos.push({
        value: valor,
        label: diasSemana[i],
        labelComponent: () => (
          <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            {diasSemana[i]}
          </Text>
        ),
        topLabelComponent: () => (
          <Text style={{ color: '#fff', fontSize: 10, marginBottom: 2 }}>
            ${(valor / 1000).toFixed(1)}k
          </Text>
        ),
        frontColor: tipoSeleccionado === 'income' ? '#22C55E' : '#EF4444',
        dia: diasSemana[i],
        diaCompleto: diasCompletos[i]
      });
    }

    return datos;
  };

  const datos = generarDatosSemana();
  const total = datos.reduce((sum, d) => sum + d.value, 0);
  const colorTema = tipoSeleccionado === 'income' ? '#22C55E' : '#EF4444';

  return (
    <View className="bg-neutral-900 rounded-2xl p-5 mb-6">
      {/* Card de Resumen con Rango de Fecha */}
      <View className="bg-neutral-800 rounded-xl p-4 mb-6">
        <Text className="text-neutral-400 text-xs uppercase mb-1">{rangoTexto}</Text>
        <Text className="text-neutral-500 text-xs mb-2">{añoActual}</Text>
        <View className="flex-row items-baseline">
          <Text className="text-white text-xs mr-1">Total</Text>
          <Text
            className="text-4xl font-bold"
            style={{ color: colorTema }}
          >
            ${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Navegación y Toggle */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Botón Prev Week */}
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset - 1)}
          className="bg-neutral-800 px-4 py-2 rounded-lg flex-row items-center"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color="#9CA3AF" />
          <Text className="text-neutral-400 text-xs ml-1">Prev</Text>
        </TouchableOpacity>

        {/* Toggle Income/Expense */}
        <View className="flex-row bg-neutral-800 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setTipoSeleccionado('income')}
            className={`px-4 py-2 rounded-md ${
              tipoSeleccionado === 'income' ? 'bg-green-500' : 'bg-transparent'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-semibold ${
                tipoSeleccionado === 'income' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Ingresos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTipoSeleccionado('expense')}
            className={`px-4 py-2 rounded-md ${
              tipoSeleccionado === 'expense' ? 'bg-red-500' : 'bg-transparent'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-semibold ${
                tipoSeleccionado === 'expense' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Gastos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón Next Week */}
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset + 1)}
          className="bg-neutral-800 px-4 py-2 rounded-lg flex-row items-center"
          activeOpacity={0.7}
          disabled={weekOffset >= 0}
          style={{ opacity: weekOffset >= 0 ? 0.5 : 1 }}
        >
          <Text className="text-neutral-400 text-xs mr-1">Next</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Gráfico de Barras con Gifted Charts */}
      <View className="bg-neutral-800 rounded-xl p-4 mb-3">
        <BarChart
          data={datos}
          barWidth={32}
          spacing={18}
          noOfSections={4}
          barBorderRadius={6}
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={0}
          xAxisColor="#404040"
          yAxisTextStyle={{ color: '#9CA3AF' }}
          isAnimated
          animationDuration={300}
          height={200}
        />
      </View>

      {/* Leyenda de Días */}
      <View className="bg-neutral-800 rounded-lg py-3 px-4 mb-3">
        <Text className="text-neutral-400 text-xs mb-2 font-semibold">Días de la semana</Text>
        <View className="flex-row justify-between">
          {datos.map((d, idx) => (
            <View key={idx} className="items-center">
              <Text className="text-neutral-300 text-xs font-bold">{d.dia}</Text>
              <Text className="text-neutral-500 text-[10px] mt-0.5">{d.diaCompleto}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Leyenda de Total */}
      <View className="flex-row justify-center items-center bg-neutral-800 rounded-lg py-3 px-4">
        <View className="w-4 h-4 rounded" style={{ backgroundColor: colorTema }} />
        <Text className="text-neutral-300 text-sm font-medium ml-2">
          {tipoSeleccionado === 'income' ? 'Ingresos' : 'Gastos'}
        </Text>
        <Text className="text-neutral-500 text-xs ml-2">
          (Total: ${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })})
        </Text>
      </View>
    </View>
  );
}
