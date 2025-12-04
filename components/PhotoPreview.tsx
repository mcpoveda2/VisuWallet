// import React, { useState } from 'react';
// import { View, Image, Button, ActivityIndicator, Alert, Text } from 'react-native';
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as FileSystem from 'expo-file-system/legacy';
// import parseOcrText from 'utils/ocrService';

// interface PhotoPreviewProps {
//   uri: string | null;
//   onBack: () => void;
//   onOcrResult?: (data: any) => void;
// }

// export default function PhotoPreview({ uri, onBack, onOcrResult }: PhotoPreviewProps) {
//   const [loading, setLoading] = useState(false);

//   async function getBase64FromUri(uri: string) {
//     try {
//       const base64String = await FileSystem.readAsStringAsync(uri, {
//         encoding: 'base64',
//       });
//       return base64String;
//     } catch (e) {
//       console.error('getBase64FromUri error', e);
//       throw e;
//     }
//   }

//   async function analizarImagen() {
//     if (!uri) return;
//     setLoading(true);

//     try {
//       // Convertir imagen a base64
//       const base64 = await getBase64FromUri(uri);
//       console.log('Base64 length:', base64?.length, 'First 50 chars:', base64?.substring(0, 50));

//       // Enviar al backend que hace OCR con Tesseract.js
//       const BACKEND_URL = 'https://ocr-backend-visu-wallet.vercel.app/api/ocr';
      
//       // El backend espera: { imageBase64: "base64_sin_prefijo" }
//       const payload = {
//         image: base64,
//       };

//       console.log('Enviando al backend:', BACKEND_URL);
//       console.log('Payload size:', JSON.stringify(payload).length);

//       const resp = await fetch(BACKEND_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       if (!resp.ok) {
//         const txt = await resp.text();
//         console.error('Backend response error:', resp.status, txt);
//         throw new Error(`OCR backend error: ${resp.status} ${txt.substring(0, 200)}`);
//       }

//       const json = await resp.json();
//       console.log('Backend response:', json);

//       // El backend devuelve el texto en varias posibles claves
//       const detectedText =
//         json.texto_completo ||
//         json.text ||
//         json.texto ||
//         (json.data && json.data.text) ||
//         (json.datos_extraidos && json.datos_extraidos.texto_completo) ||
//         '';

//       if (!detectedText || detectedText.trim().length === 0) {
//         throw new Error('No se detectó texto en la imagen (backend)');
//       }

//       console.log('Texto detectado:', detectedText.substring(0, 100));

//       // Parsear localmente para extraer monto, fecha y labels
//       const parsed = parseOcrText(detectedText);

//       const ocrDataForForm = {
//         amount: parsed.amount,
//         date: parsed.date,
//         rawText: detectedText,
//         labels: parsed.labels,
//       };

//       console.log('OCR data parsed:', ocrDataForForm);

//       if (onOcrResult) onOcrResult(ocrDataForForm);

//       Alert.alert('OCR completado', 'Datos extraídos listos para autocompletar.');
//     } catch (e: any) {
//       console.error('OCR Error:', e);
//       Alert.alert('Error OCR', e.message || 'Error procesando la imagen');
//     } finally {
//       setLoading(false);
//     }
//   }



//   return (
//     <SafeAreaView className="flex-1 bg-black p-safe m-safe">
//       <View className="flex-1 items-center justify-center p-4">
//         {uri ? (
//           <Image
//             source={{ uri }}
//             style={{ width: '100%', height: '80%' }}
//             resizeMode="contain"
//           />
//         ) : (
//           <View />
//         )}
//         {loading && (
//           <View style={{ position: 'absolute', top: '50%', alignItems: 'center' }}>
//             <ActivityIndicator size="large" color="#00BFFF" />
//             <Text style={{ color: '#00BFFF', marginTop: 12, fontSize: 14 }}>
//               Procesando OCR...
//             </Text>
//           </View>
//         )}
//       </View>

//       <View className="p-4 flex-row justify-between">
//         <Button title="Volver" onPress={onBack} disabled={loading} />
//         <Button title="Analizar imagen" onPress={analizarImagen} disabled={loading} />
//       </View>
//     </SafeAreaView>
//   );
// }

import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, Alert, Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
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

      // Enviar al backend con timeout de 60 segundos
      setStatus('Enviando al servidor OCR...');
      const BACKEND_URL = 'https://ocr-backend-visu-wallet.vercel.app/api/ocr';

      const payload = { image: base64 };

      console.log('Enviando al backend:', BACKEND_URL);
      console.log('Payload keys:', Object.keys(payload));
      console.log('Payload size:', JSON.stringify(payload).length, 'bytes');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        throw new Error(`OCR backend error: ${resp.status}${txt ? ' - ' + txt.substring(0, 100) : ''}`);
      }

      setStatus('Procesando respuesta...');
      const json = await resp.json();
      console.log('Backend response:', json);

      const detectedText =
        json.texto_completo ||
        json.text ||
        json.texto ||
        (json.data && json.data.text) ||
        (json.datos_extraidos && json.datos_extraidos.texto_completo) ||
        '';

      if (!detectedText || detectedText.trim().length === 0) {
        throw new Error('No se detectó texto en la imagen');
      }

      console.log('Texto detectado:', detectedText.substring(0, 100));

      setStatus('Extrayendo datos...');
      const parsed = parseOcrText(detectedText);

      const ocrDataForForm = {
        amount: parsed.amount,
        date: parsed.date,
        rawText: detectedText,
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
