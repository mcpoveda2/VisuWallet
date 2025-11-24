import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface BarData {
  label: string;
  value: number;
  color: string;
  porcentaje: number;
}

interface GraficoBarrasHorizontalesProps {
  datos: BarData[];
  titulo: string;
  limite?: number; // Mostrar solo top N
}

export default function GraficoBarrasHorizontales({
  datos,
  titulo,
  limite = 5
}: GraficoBarrasHorizontalesProps) {
  const total = datos.reduce((sum, d) => sum + d.value, 0);

  if (total === 0 || datos.length === 0) {
    return (
      <View className="bg-neutral-900 rounded-2xl p-5 items-center justify-center h-48">
        <Text className="text-neutral-400">No hay datos para mostrar</Text>
      </View>
    );
  }

  // Ordenar por valor descendente y tomar top N
  const datosOrdenados = [...datos]
    .sort((a, b) => b.value - a.value)
    .slice(0, limite);

  // Preparar datos para Gifted Charts (barras horizontales)
  const datosGrafico = datosOrdenados.map((d) => ({
    value: d.value,
    frontColor: d.color,
    topLabelComponent: () => (
      <View style={{ backgroundColor: '#404040', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4 }}>
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
          {d.porcentaje}%
        </Text>
      </View>
    ),
  }));

  return (
    <View className="bg-neutral-900 rounded-2xl p-5">
      <Text className="text-white text-lg font-bold mb-6">{titulo}</Text>

      {/* Gráfico de barras horizontales con Gifted Charts */}
      <View className="bg-neutral-800 rounded-xl p-4 mb-4">
        <View style={{ marginLeft: -20 }}>
          <BarChart
            data={datosGrafico}
            horizontal
            barWidth={24}
            spacing={16}
            noOfSections={3}
            barBorderRadius={6}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisColor="#404040"
            yAxisTextStyle={{ color: '#9CA3AF' }}
            isAnimated
            animationDuration={400}
            height={datosOrdenados.length * 40}
            width={220}
            initialSpacing={0}
          />
        </View>
      </View>

      {/* Leyenda detallada */}
      <View className="bg-neutral-800 rounded-xl p-4">
        {datosOrdenados.map((cat, idx) => (
          <View
            key={idx}
            className="flex-row items-center justify-between py-2"
            style={{
              borderBottomWidth: idx < datosOrdenados.length - 1 ? 1 : 0,
              borderBottomColor: '#404040'
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: cat.color }}
              />
              <Text className="text-white text-xs font-medium flex-1" numberOfLines={1}>
                {cat.label}
              </Text>
            </View>
            <View className="flex-row items-center ml-2">
              <Text className="text-neutral-400 text-xs mr-2">
                ${cat.value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </Text>
              <View className="bg-neutral-700 px-2 py-1 rounded">
                <Text className="text-white font-bold text-xs">
                  {cat.porcentaje}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Mostrar total si hay más categorías */}
      {datos.length > limite && (
        <View className="mt-4 pt-4 border-t border-neutral-800">
          <Text className="text-neutral-400 text-xs text-center">
            Mostrando top {limite} de {datos.length} categorías
          </Text>
        </View>
      )}
    </View>
  );
}
