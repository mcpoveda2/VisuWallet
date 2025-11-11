import { View, Text } from 'react-native';

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

  // Calcular ángulos acumulados
  let anguloAcumulado = 0;
  const segmentos = datosOrdenados.map(d => {
    const angulo = (d.value / total) * 360;
    const inicio = anguloAcumulado;
    anguloAcumulado += angulo;
    return { ...d, angulo, inicioAngulo: inicio };
  });

  return (
    <View className="bg-neutral-900 rounded-2xl p-5">
      <Text className="text-white text-lg font-bold mb-6">{titulo}</Text>

      {/* Gráfico de pastel completo */}
      <View className="items-center mb-8">
        <View className="relative w-56 h-56">
          {/* Segmentos del pastel */}
          {segmentos.map((seg, idx) => {
            // Solo mostrar si el ángulo es significativo
            if (seg.angulo < 1) return null;

            return (
              <View
                key={idx}
                className="absolute w-56 h-56 items-center justify-center overflow-hidden rounded-full"
              >
                <View
                  className="absolute w-56 h-28"
                  style={{
                    backgroundColor: seg.color,
                    top: 0,
                    transform: [{ rotate: `${seg.inicioAngulo}deg` }],
                    transformOrigin: 'center bottom',
                    opacity: 0.95
                  }}
                />
                {seg.angulo > 180 && (
                  <View
                    className="absolute w-56 h-28"
                    style={{
                      backgroundColor: seg.color,
                      top: 0,
                      transform: [{ rotate: `${seg.inicioAngulo + 180}deg` }],
                      transformOrigin: 'center bottom',
                      opacity: 0.95
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
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
              {d.porcentaje}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
