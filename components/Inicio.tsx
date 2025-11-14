import React from "react";
import { Text, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

interface InicioProps {
  onPressManual: () => void;
  onBack: () => void;
  onPhotoTaken?: (uri: string) => void;
}

export default function Inicio({ onPressManual, onBack, onPhotoTaken }: InicioProps) {

  async function requestPermissions() {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (camera.status !== 'granted' || media.status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Permite acceso a la cámara y archivos en ajustes.');
      return false;
    }
    return true;
  }

  async function openCamera() {
    const ok = await requestPermissions();
    if (!ok) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      // Compatibilidad con distintas versiones de Expo ImagePicker:
      // result.cancelled (antiguo) o result.canceled (nuevo)
      // y result.uri (antiguo) o result.assets[0].uri (nuevo)
      // @ts-ignore
      const cancelled = result.cancelled ?? result.canceled ?? false;
      // @ts-ignore
      const uri = result.uri ?? (result.assets && result.assets[0] && result.assets[0].uri) ?? null;
      if (!cancelled && uri && onPhotoTaken) {
        onPhotoTaken(uri);
      }
    } catch (e) {
      console.error('openCamera error', e);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  }

  async function openGallery() {
    const ok = await requestPermissions();
    if (!ok) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      // Compatibilidad con distintas versiones de Expo ImagePicker:
      // result.cancelled (antiguo) o result.canceled (nuevo)
      // y result.uri (antiguo) o result.assets[0].uri (nuevo)
      // @ts-ignore
      const cancelled = result.cancelled ?? result.canceled ?? false;
      // @ts-ignore
      const uri = result.uri ?? (result.assets && result.assets[0] && result.assets[0].uri) ?? null;
      if (!cancelled && uri && onPhotoTaken) {
        onPhotoTaken(uri);
      }
    } catch (e) {
      console.error('openGallery error', e);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  }

  return (
    <SafeAreaView
      className="flex-1 bg-black p-safe m-safe"
    >
      {/* Botón de volver */}
      <View className="px-6 py-4 -mt-16">
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-white mb-10 text-center">
          Empieza a controlar tus finanzas desde un click
        </Text>

        <View className="w-full space-y-5">
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-sky-600 py-4 rounded-2xl items-center shadow-lg shadow-sky-800 mb-10 mt-20 w-full"
          >
            <Text className="text-white text-lg font-semibold">Telegram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openCamera}
            activeOpacity={0.8}
            className="bg-emerald-600 py-4 rounded-2xl items-center shadow-lg shadow-emerald-800 mt-20 mb-5 w-full"
          >
            <Text className="text-white text-lg font-semibold">Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openGallery}
            activeOpacity={0.8}
            className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-800 w-full"
          >
            <Text className="text-white text-lg font-semibold">Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressManual}  
            activeOpacity={0.8}
            className="bg-violet-600 py-4 rounded-2xl items-center shadow-lg shadow-violet-800 mt-5 mb-30 w-full"
          >
            <Text className="text-white text-lg font-semibold">Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}