import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from 'utils/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved?: (docId: string) => void;
}

export default function AddCuenta({ visible, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<'corriente' | 'ahorros'>('corriente');
  const [numero, setNumero] = useState('');
  const [saldo, setSaldo] = useState('0');
  const [cedula, setCedula] = useState('');
  const [propietario, setPropietario] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTipo('corriente');
    setNumero('');
    setSaldo('0');
    setCedula('');
    setPropietario('');
    setEmail('');
  };

  const handleSave = async () => {
    if (!numero || !propietario) {
      Alert.alert('Campos requeridos', 'Ingrese número de cuenta y nombre del propietario');
      return;
    }

    const parsedSaldo = Number(saldo) || 0;
    const payload = {
      tipo,
      numero,
      saldo: parsedSaldo,
      cedula,
      propietario,
      email: email || null,
      createdAt: serverTimestamp(),
    } as any;

    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'cuentas'), payload);
      console.log('Cuenta creada', ref.id, payload);
      reset();
      onClose();
      onSaved?.(ref.id);
    } catch (e) {
      console.warn('Failed to save account to Firestore, falling back to console', e);
      // Fallback: just log and close
      console.log('Fallback cuenta', payload);
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} className='mt-20'>
      <SafeAreaView className="flex-1 bg-black px-4 py-2">
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-white text-lg font-semibold">Agregar cuenta</Text>
          <TouchableOpacity onPress={onClose} className="px-2 py-1">
            <Text className="text-sky-400">Cerrar</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <Text className="text-sm text-gray-400 mb-2">Tipo de cuenta</Text>
          <View className="flex-row bg-neutral-800 rounded-xl p-1 mb-4">
            <Pressable
              onPress={() => setTipo('corriente')}
              className={`flex-1 rounded-lg py-2 items-center justify-center ${tipo === 'corriente' ? 'bg-neutral-700' : ''}`}>
              <Text className={`${tipo === 'corriente' ? 'text-white' : 'text-neutral-400'} font-medium`}>Corriente</Text>
            </Pressable>

            <Pressable
              onPress={() => setTipo('ahorros')}
              className={`flex-1 rounded-lg py-2 items-center justify-center ${tipo === 'ahorros' ? 'bg-neutral-700' : ''}`}>
              <Text className={`${tipo === 'ahorros' ? 'text-white' : 'text-neutral-400'} font-medium`}>Ahorros</Text>
            </Pressable>
          </View>

          <Text className="text-sm text-gray-400">Número de cuenta</Text>
          <TextInput
            value={numero}
            onChangeText={setNumero}
            placeholder="0000-0000-0000"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 text-white px-3 py-2 rounded-lg mb-3"
          />

          <Text className="text-sm text-gray-400">Saldo actual</Text>
          <TextInput
            value={saldo}
            onChangeText={setSaldo}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 text-white px-3 py-2 rounded-lg mb-3"
          />

          <Text className="text-sm text-gray-400">Cédula</Text>
          <TextInput
            value={cedula}
            onChangeText={setCedula}
            placeholder="Cedula"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 text-white px-3 py-2 rounded-lg mb-3"
          />

          <Text className="text-sm text-gray-400">Nombre del propietario</Text>
          <TextInput
            value={propietario}
            onChangeText={setPropietario}
            placeholder="Nombre completo"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 text-white px-3 py-2 rounded-lg mb-3"
          />

          <Text className="text-sm text-gray-400">Correo (opcional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#6b7280"
            className="bg-neutral-900 text-white px-3 py-2 rounded-lg mb-6"
            keyboardType="email-address"
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-sky-500 rounded-xl items-center py-3"
          >
            <Text className="text-white font-medium">{saving ? 'Guardando...' : 'Guardar cuenta'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
