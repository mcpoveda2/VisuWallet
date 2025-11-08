// Componente Reutilizable para las cuentas y tarjetas.
import {View, Text, TouchableOpacity} from 'react-native';
import {Cuenta} from '../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface CuentaCardProps {
    cuenta: Cuenta;
    onPress?:() => void;
}

export default function CuentaCard({cuenta, onPress}: CuentaCardProps){

    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-neutral-800  rounded-2x1 p-4 w-[48%] mb-4"
            > 
             <View className={`bg-neutral-950 w-10 h-10 rounded-xl items-center justify-center mb-3`}>
                 <MaterialCommunityIcons name="bank" size={24} color="white" />
            </View>

            <Text className="text-neutral-400 text-xs font-medium mb-1" numberOfLines={1}>
                    {cuenta.nombre}
            </Text>
          <Text className="text-white text-2xl font-bold">
                ${cuenta.balance.toFixed(2)}
            </Text>    
        </TouchableOpacity>
    )
}