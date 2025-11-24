import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

interface PieSegmentData {
  label: string;
  value: number;
  color: string;
  porcentaje: number;
}

interface GraficosPastelProps {
  datos: PieSegmentData[];
  titulo: string;
}

export default function GraficosPastel({ datos, titulo }: GraficosPastelProps) {
  const total = datos.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <View className="bg-neutral-900 rounded-2xl p-5 items-center justify-center h-48">
        <Text className="text-neutral-400">No hay datos para mostrar</Text>
      </View>
    );
  }

  // Ordenar por valor descendente
  const datosOrdenados = [...datos].sort((a, b) => b.value - a.value);

  // Transformar datos para Gifted Charts
  const pieData = datosOrdenados.map(d => ({
    value: d.value,
    color: d.color,
    text: `${Math.round((d.value / total) * 100)}%`,
    label: d.label
  }));

  return (
    <View className="bg-neutral-900 rounded-2xl p-5">
      <Text className="text-white text-lg font-bold mb-6">{titulo}</Text>

      {/* Gráfico de pastel con Gifted Charts */}
      <View className="items-center mb-8">
        <PieChart
          data={pieData}
          radius={110}
          showText
          textColor="#fff"
          textSize={14}
          fontWeight="bold"
          focusOnPress
          sectionAutoFocus
          labelsPosition="outward"
        />
      </View>

      {/* Leyenda */}
      <View className="bg-neutral-800 rounded-xl p-4">
        {datosOrdenados.map((d, idx) => (
          <View
            key={idx}
            className="flex-row items-center py-3"
            style={{
              borderBottomWidth: idx < datosOrdenados.length - 1 ? 1 : 0,
              borderBottomColor: '#404040'
            }}
          >
            <View
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: d.color }}
            />
            <View className="flex-1">
              <Text className="text-white text-sm font-medium">{d.label}</Text>
              <Text className="text-neutral-400 text-xs mt-0.5">
                ${d.value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <Text className="text-white font-bold text-sm bg-neutral-700 px-2 py-1 rounded">
              {Math.round((d.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
