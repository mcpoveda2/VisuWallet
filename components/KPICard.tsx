import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface KPICardProps {
  titulo: string;
  valor: string;
  icono?: keyof typeof MaterialCommunityIcons.glyphMap;
  cambio?: number; // Porcentaje de cambio (opcional)
  colorTema?: 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'yellow';
  subtitulo?: string;
}

export default function KPICard({
  titulo,
  valor,
  icono,
  cambio,
  colorTema = 'blue',
  subtitulo
}: KPICardProps) {
  // Mapeo de colores
  const colores = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-500',
      icon: '#3B82F6'
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-500',
      icon: '#22C55E'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      icon: '#EF4444'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-500',
      icon: '#A855F7'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-500',
      icon: '#06B6D4'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500',
      icon: '#EAB308'
    }
  };

  const tema = colores[colorTema];

  return (
    <View className={`flex-1 ${tema.bg} border ${tema.border} rounded-xl p-4`}>
      {/* Header con icono */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-neutral-400 text-xs uppercase font-semibold">
          {titulo}
        </Text>
        {icono && (
          <MaterialCommunityIcons name={icono} size={18} color={tema.icon} />
        )}
      </View>

      {/* Valor principal */}
      <Text className={`${tema.text} text-2xl font-bold mb-1`}>
        {valor}
      </Text>

      {/* Cambio porcentual o subtítulo */}
      {cambio !== undefined && (
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name={cambio >= 0 ? "arrow-up" : "arrow-down"}
            size={14}
            color={cambio >= 0 ? '#22C55E' : '#EF4444'}
          />
          <Text className={`text-xs font-semibold ml-1 ${cambio >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(cambio).toFixed(1)}%
          </Text>
        </View>
      )}

      {subtitulo && !cambio && (
        <Text className="text-neutral-400 text-xs">
          {subtitulo}
        </Text>
      )}
    </View>
  );
}
