import { View, Text } from 'react-native';
import { Transaccion } from '../types';

interface GraficoUltimos30DiasProps {
  transacciones: Transaccion[];
}

export default function GraficoUltimos30Dias({ transacciones }: GraficoUltimos30DiasProps) {
  // Obtener datos de los últimos 30 días
  const hoy = new Date();
  const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const datos = Array.from({ length: 30 }, (_, i) => {
    const fecha = new Date(hace30Dias.getTime() + i * 24 * 60 * 60 * 1000);
    const fechaStr = fecha.toISOString().split('T')[0];

    const transaccionesDelDia = transacciones.filter(t => {
      if (!t.fecha) return false;
      const tFecha = new Date(t.fecha);
      return tFecha.toISOString().split('T')[0] === fechaStr;
    });

    const gastos = transaccionesDelDia
      .filter(t => t.tipo === 'expense' || t.tipo === 'transfer')
      .reduce((sum, t) => sum + t.monto, 0);

    const ingresos = transaccionesDelDia
      .filter(t => t.tipo === 'income')
      .reduce((sum, t) => sum + t.monto, 0);

    return {
      dia: fecha.getDate(),
      gastos,
      ingresos,
      neto: ingresos - gastos
    };
  });

  // Encontrar máximo para escalar
  const maxValor = Math.max(...datos.map(d => Math.max(d.gastos, d.ingresos)), 1);
  const heightBase = 70; // altura máxima en píxeles

  const totalGastos = datos.reduce((s, d) => s + d.gastos, 0);
  const totalIngresos = datos.reduce((s, d) => s + d.ingresos, 0);

  return (
    <View className="bg-neutral-900 rounded-xl p-4">
      {/* Encabezado */}
      <Text className="text-white text-sm font-semibold mb-4">Últimos 30 días</Text>

      {/* Resumen */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <Text className="text-red-400 text-xs uppercase mb-1 font-semibold">Total Gastos</Text>
          <Text className="text-red-500 font-bold text-base">
            ${totalGastos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <Text className="text-green-400 text-xs uppercase mb-1 font-semibold">Total Ingresos</Text>
          <Text className="text-green-500 font-bold text-base">
            ${totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Gráfico de barras comparativas */}
      <View className="bg-neutral-800 rounded-lg p-4 mb-4">
        <View className="h-48 flex-row items-flex-end justify-between gap-1">
          {datos.map((dia, idx) => {
            const heightGastos = (dia.gastos / maxValor) * heightBase;
            const heightIngresos = (dia.ingresos / maxValor) * heightBase;

            return (
              <View key={idx} className="flex-1 flex-row items-flex-end justify-center gap-0.5">
                {/* Barra de gastos (izquierda) */}
                {dia.gastos > 0 && (
                  <View
                    className="rounded-t-sm"
                    style={{
                      width: '48%',
                      height: Math.max(2, heightGastos),
                      backgroundColor: '#EF4444',
                      opacity: 0.85
                    }}
                  />
                )}
                {/* Barra de ingresos (derecha) */}
                {dia.ingresos > 0 && (
                  <View
                    className="rounded-t-sm"
                    style={{
                      width: '48%',
                      height: Math.max(2, heightIngresos),
                      backgroundColor: '#22C55E',
                      opacity: 0.85
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Etiquetas de días (cada 5 días) */}
        <View className="flex-row justify-between mt-2 px-1">
          {[0, 5, 10, 15, 20, 25, 29].map(idx => (
            <Text key={idx} className="text-neutral-500 text-xs">
              {datos[idx].dia}
            </Text>
          ))}
        </View>
      </View>

      {/* Leyenda */}
      <View className="flex-row justify-center gap-6">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#EF4444' }} />
          <Text className="text-neutral-400 text-xs">Gastos</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#22C55E' }} />
          <Text className="text-neutral-400 text-xs">Ingresos</Text>
        </View>
      </View>
    </View>
  );
}
