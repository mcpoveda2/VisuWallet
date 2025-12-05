import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, Alert, Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

interface PhotoPreviewProps {
  uri: string | null;
  onBack: () => void;
  onOcrResult?: (data: any) => void;
}

export default function PhotoPreview({ uri, onBack, onOcrResult }: PhotoPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function compressImageTo1MB(uri: string): Promise<string> {
    try {
      setStatus('Comprimiendo imagen...');
      console.log('Imagen original:', uri);

      let currentUri = uri;
      let quality = 0.9;
      let width = 1200;

      // Reducir calidad y tamaño hasta llegar a ~1MB
      while (true) {
        const resized = await ImageManipulator.manipulateAsync(
          currentUri,
          [{ resize: { width } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64String = await FileSystem.readAsStringAsync(resized.uri, {
          encoding: 'base64',
        });

        // Aproximar tamaño en bytes (base64 es ~1.33x el tamaño binario)
        const sizeInBytes = (base64String.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        console.log(
          `Intento - Width: ${width}, Quality: ${quality.toFixed(2)}, Size: ${sizeInMB.toFixed(2)}MB`
        );

        if (sizeInMB <= 1 || quality < 0.3) {
          console.log(`✅ Imagen comprimida a ${sizeInMB.toFixed(2)}MB`);
          return base64String;
        }

        // Reducir calidad o ancho para próximo intento
        if (quality > 0.5) {
          quality -= 0.1;
        } else {
          width -= 100;
        }

        currentUri = resized.uri;
      }
    } catch (e) {
      console.error('compressImageTo1MB error', e);
      throw e;
    }
  }

  async function analizarImagen() {
    if (!uri) return;
    setLoading(true);
    setStatus('Preparando imagen...');

    try {
      // Comprimir a máximo 1MB
      setStatus('Comprimiendo a máximo 1MB...');
      const base64 = await compressImageTo1MB(uri);

      // Enviar al backend con GPT
      setStatus('Enviando al backend con GPT-4o-mini-vision...');
      const BACKEND_URL = 'https://ocr-backend-visu-wallet.vercel.app/api/analyze-image';

      const payload = { imageBase64: base64 };

      console.log('Enviando al backend:', BACKEND_URL);
      console.log(
        'Payload size:',
        (JSON.stringify(payload).length * 3) / (4 * 1024 * 1024),
        'MB'
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 90 segundos para GPT

      const resp = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Backend response error:', resp.status, txt.substring(0, 300));
        throw new Error(
          `Backend error: ${resp.status}${txt ? ' - ' + txt.substring(0, 200) : ''}`
        );
      }

      setStatus('Procesando respuesta del backend...');
      const json = await resp.json();
      console.log('Backend response:', json);

      // Parsear respuesta de GPT
      // Esperamos: { monto_total, etiquetas, descripcion }
      let parsedResponse = json;

      // Si la respuesta está dentro de un objeto "choices" (formato OpenAI)
      if (json.choices && json.choices[0] && json.choices[0].message) {
        const messageContent = json.choices[0].message.content;
        try {
          parsedResponse = JSON.parse(messageContent);
        } catch (e) {
          console.warn('Could not parse GPT response as JSON, using raw:', messageContent);
          parsedResponse = { descripcion: messageContent };
        }
      }

      const montTotal = parsedResponse.monto_total || parsedResponse.amount || null;
      const etiquetas = parsedResponse.etiquetas || parsedResponse.labels || [];
      const descripcion = parsedResponse.descripcion || parsedResponse.description || '';

      if (!montTotal && !etiquetas && !descripcion) {
        throw new Error('No se extrajeron datos significativos de la imagen.');
      }

      setStatus('Preparando datos...');

      const ocrDataForForm = {
        amount: montTotal ? parseFloat(montTotal) : null,
        labels: Array.isArray(etiquetas) ? etiquetas : [etiquetas],
        rawText: descripcion,
      };

      console.log('OCR data parsed:', ocrDataForForm);

      if (onOcrResult) onOcrResult(ocrDataForForm);

      Alert.alert('✅ Análisis completado', 'Datos extraídos listos para autocompletar.');
    } catch (e: any) {
      console.error('Análisis Error:', e);
      const errorMsg =
        e.name === 'AbortError'
          ? 'Timeout: El servidor tardó demasiado. Intenta con una imagen más clara.'
          : e.message || 'Error procesando la imagen';
      Alert.alert('❌ Error', errorMsg);
    } finally {
      setLoading(false);
      setStatus('');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black p-safe m-safe">
      <View className="flex-1 items-center justify-center p-4">
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '70%' }}
            resizeMode="contain"
          />
        ) : (
          <View />
        )}
        {loading && (
          <View style={{ position: 'absolute', top: '50%', alignItems: 'center', width: '100%' }}>
            <ActivityIndicator size="large" color="#00BFFF" />
            <Text
              style={{
                color: '#00BFFF',
                marginTop: 12,
                fontSize: 14,
                textAlign: 'center',
                paddingHorizontal: 20,
              }}>
              {status || 'Procesando...'}
            </Text>
          </View>
        )}
      </View>

      <View className="p-4 flex-row justify-between">
        <Button title="Volver" onPress={onBack} disabled={loading} />
        <Button title="Analizar imagen" onPress={analizarImagen} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}
