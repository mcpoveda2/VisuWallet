import { View, TouchableOpacity, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface NavBarProps {
  onPressAdd: () => void;  // Función que se ejecuta al tocar el "+"
  onPressEstadisticas?: () => void;  // Función que se ejecuta al tocar "Estadísticas"
  onPressCharts?: () => void;  // Función que se ejecuta al tocar "Gráficos"
}

export default function NavBar({ onPressAdd, onPressEstadisticas, onPressCharts }: NavBarProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800">
      <View className="flex-row items-center justify-around py-3">
        {/* Home */}
        <TouchableOpacity 
          className="items-center justify-center px-4 py-2"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="view-dashboard" size={24} color="white" />
          <Text className="text-white text-xs mt-1">Resumen</Text>
        </TouchableOpacity>

        {/* Estadísticas */}
        <TouchableOpacity
          onPress={onPressEstadisticas}
          className="items-center justify-center px-4 py-2"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chart-bar" size={24} color="#737373" />
          <Text className="text-neutral-500 text-xs mt-1">Estadísticas</Text>
        </TouchableOpacity>

        {/* Botón + central (más grande) */}
        <TouchableOpacity 
          onPress={onPressAdd}
          className="bg-blue-500 w-14 h-14 rounded-full items-center justify-center -mt-6"
          activeOpacity={0.8}
          style={{
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <MaterialCommunityIcons name="plus" size={32} color="white" />
        </TouchableOpacity>

        {/* Gráficos */}
        <TouchableOpacity
          onPress={onPressCharts}
          className="items-center justify-center px-4 py-2"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chart-line" size={24} color="#737373" />
          <Text className="text-neutral-500 text-xs mt-1">Gráficos</Text>
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity 
          className="items-center justify-center px-4 py-2"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="account" size={24} color="#737373" />
          <Text className="text-neutral-500 text-xs mt-1">Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}