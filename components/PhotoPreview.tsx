import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, Alert, Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import parseOcrText from 'utils/ocrService';

interface PhotoPreviewProps {
  uri: string | null;
  onBack: () => void;
  onOcrResult?: (data: any) => void;
}

export default function PhotoPreview({ uri, onBack, onOcrResult }: PhotoPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function compressAndEncodeImage(uri: string): Promise<string> {
    try {
      setStatus('Comprimiendo imagen...');
      console.log('Imagen original:', uri);

      // Redimensionar y comprimir
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Obtener base64
      setStatus('Codificando imagen...');
      const base64String = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: 'base64',
      });

      console.log('Imagen comprimida, base64 size:', base64String.length);
      return base64String;
    } catch (e) {
      console.error('compressAndEncodeImage error', e);
      throw e;
    }
  }

  async function analizarImagen() {
    if (!uri) return;
    setLoading(true);
    setStatus('Preparando imagen...');

    try {
      // Comprimir y codificar
      const base64 = await compressAndEncodeImage(uri);

      // Enviar a OCR.Space (API key desde app extras)
      setStatus('Enviando a OCR.Space...');
      const OCR_KEY = (Constants.manifest && (Constants.manifest.extra && Constants.manifest.extra.OCR_SPACE_KEY)) ||
        (Constants.expoConfig && (Constants.expoConfig.extra && Constants.expoConfig.extra.OCR_SPACE_KEY)) ||
        (process.env.OCR_SPACE_KEY || '');

      if (!OCR_KEY) {
        throw new Error('OCR API key no encontrada. Añade OCR_SPACE_KEY en .env');
      }

      const form = new FormData();
      form.append('apikey', OCR_KEY);
      form.append('isOverlayRequired', 'false');
      form.append('language', 'spa');
      // OCR.Space expects data URI prefix for base64 payload
      form.append('base64Image', `data:image/jpeg;base64,${base64}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const resp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: form as any,
        // DO NOT set Content-Type; let fetch set the multipart boundary
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('OCR.Space response error:', resp.status, txt.substring(0, 300));
        throw new Error(`OCR.Space error: ${resp.status} - ${txt.substring(0, 200)}`);
      }

      setStatus('Procesando respuesta de OCR.Space...');
      const json = await resp.json();
      console.log('OCR.Space response:', json);

      const parsedText = json.ParsedResults && json.ParsedResults[0] && json.ParsedResults[0].ParsedText
        ? json.ParsedResults[0].ParsedText
        : (json.ParsedResults && json.ParsedResults[0] && json.ParsedResults[0].TextOverlay && json.ParsedResults[0].TextOverlay.lines ? json.ParsedResults[0].TextOverlay.lines.map((l:any)=>l.LineText).join('\n') : '');

      if (!parsedText || parsedText.trim().length === 0) {
        throw new Error('No se detectó texto en la imagen (OCR.Space).');
      }

      setStatus('Extrayendo datos...');
      const parsed = parseOcrText(parsedText);

      const ocrDataForForm = {
        amount: parsed.amount,
        date: parsed.date,
        rawText: parsedText,
        labels: parsed.labels,
      };

      console.log('OCR data parsed:', ocrDataForForm);

      if (onOcrResult) onOcrResult(ocrDataForForm);

      Alert.alert('✅ OCR completado', 'Datos extraídos listos para autocompletar.');
    } catch (e: any) {
      console.error('OCR Error:', e);
      const errorMsg =
        e.name === 'AbortError'
          ? 'Timeout: El servidor tardó demasiado. Intenta con una imagen más pequeña o clara.'
          : e.message || 'Error procesando la imagen';
      Alert.alert('❌ Error OCR', errorMsg);
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
            <Text style={{ color: '#00BFFF', marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
              {status || 'Procesando OCR...'}
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
