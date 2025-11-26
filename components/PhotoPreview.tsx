import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';

interface PhotoPreviewProps {
  uri: string | null;
  onBack: () => void;
  onOcrResult?: (data: any) => void; // Nueva prop opcional para pasar datos a Formulario
}

export default function PhotoPreview({ uri, onBack, onOcrResult }: PhotoPreviewProps) {
  const [loading, setLoading] = useState(false);

  async function getBase64FromUri(uri: string) {
    return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  }

  async function analizarImagen() {
    if (!uri) return;
    setLoading(true);
    try {
      const base64 = await getBase64FromUri(uri);
      const response = await fetch('https://ocr-backend-visu-wallet.vercel.app/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (onOcrResult) onOcrResult(data);
      Alert.alert('OCR completado', 'Datos extraídos listos para autocompletar.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo analizar la imagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black p-safe m-safe">
      <View className="flex-1 items-center justify-center p-4">
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '80%' }}
            resizeMode="contain"
          />
        ) : (
          <View />
        )}
        {loading && <ActivityIndicator size="large" color="#00BFFF" style={{ position: 'absolute', top: '50%' }} />}
      </View>

      <View className="p-4 flex-row justify-between">
        <Button title="Volver" onPress={onBack} />
        <Button title="Analizar imagen" onPress={analizarImagen} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}