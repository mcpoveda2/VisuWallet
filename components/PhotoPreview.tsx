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
      let currentUri = uri;
      let quality = 0.9;
      let width = 1200;

      while (true) {
        const resized = await ImageManipulator.manipulateAsync(
          currentUri,
          [{ resize: { width } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64String = await FileSystem.readAsStringAsync(resized.uri, {
          encoding: 'base64',
        });

        const sizeInBytes = (base64String.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInMB <= 1 || quality < 0.3) {
          return base64String;
        }

        if (quality > 0.5) quality -= 0.1;
        else width -= 100;

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
      // 1. Comprimir
      const base64 = await compressImageTo1MB(uri);

      // 2. URL del backend local o remoto
      const BACKEND_URL = "http://192.168.1.8:3001/analyze"; 
      // Cambia por tu IP local o localhost si usas Android emulator

      setStatus('Enviando al backend con OLLAMA...');

      const resp = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 })
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error("Backend error: " + msg);
      }

      const result = await resp.json();
      console.log("🔍 Result from backend:", result);

      // El backend puede devolver la respuesta embebida en distintos campos.
      // Por ejemplo: { model, created_at, response: "{ \"monto_total\": \"4.36\", ... }" }
      let parsed: any = result;

      if (result && typeof result === 'object') {
        // Si existe campo `response` como string, intentar parsearlo
        if (typeof result.response === 'string') {
          const raw = result.response;
          try {
            parsed = JSON.parse(raw);
          } catch (err) {
            // Extract JSON substring if possible
            const first = raw.indexOf('{');
            const last = raw.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
              try {
                parsed = JSON.parse(raw.substring(first, last + 1));
              } catch (err2) {
                console.warn('Could not parse nested response JSON', err2);
                parsed = { descripcion: raw };
              }
            } else {
              parsed = { descripcion: raw };
            }
          }
        }

        // Si viene en formato OpenAI (choices[].message.content), intentar parsear
        if (result.choices && Array.isArray(result.choices) && result.choices[0] && result.choices[0].message) {
          const msg = result.choices[0].message.content;
          if (typeof msg === 'string') {
            try {
              parsed = JSON.parse(msg);
            } catch (e) {
              const first = msg.indexOf('{');
              const last = msg.lastIndexOf('}');
              if (first !== -1 && last !== -1 && last > first) {
                try {
                  parsed = JSON.parse(msg.substring(first, last + 1));
                } catch (_err) {
                  parsed = { descripcion: msg };
                }
              } else {
                parsed = { descripcion: msg };
              }
            }
          } else if (typeof msg === 'object') {
            parsed = msg;
          }
        }
      }

      // Extraer campos esperados: monto_total, etiquetas, descripcion
      const montoRaw = parsed.monto_total ?? parsed.amount ?? parsed.total ?? null;
      const etiquetasRaw = parsed.etiquetas ?? parsed.labels ?? parsed.etiquetas_sugeridas ?? [];
      const descripcionRaw = parsed.descripcion ?? parsed.description ?? parsed.descripcion_corta ?? parsed.rawText ?? '';

      const ocrData = {
        amount: montoRaw != null ? montoRaw : null,
        labels: Array.isArray(etiquetasRaw) ? etiquetasRaw : (etiquetasRaw ? [etiquetasRaw] : []),
        rawText: descripcionRaw || ''
      };

      console.log('Normalized OCR data:', ocrData);

      if (onOcrResult) onOcrResult(ocrData);

      Alert.alert("Éxito", "Datos extraídos correctamente.");
    } catch (e: any) {
      console.error("Analyze error:", e);
      Alert.alert("Error", e.message || "Error analizando imagen.");
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
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 12, color: 'white' }}>{status}</Text>
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

