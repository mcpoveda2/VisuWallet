// App.tsx
// App.tsx

import "global.css";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Home from "components/Home";
import Inicio from "components/Inicio";
import Formulario from "components/Formulario";
import PhotoPreview from "components/PhotoPreview";
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import DetalleCuenta from "components/DetalleCuenta";
import Estadisticas from "components/Estadisticas";
import ChartsScreen from "components/ChartsScreen";

import { Cuenta } from "./types";


export default function App() {
  // Estado para controlar qué pantalla mostrar
  const [currentScreen, setCurrentScreen] = useState<'home' | 'inicio' | 'formulario' | 'detalleCuenta' | 'estadisticas' | 'charts' | 'photoPreview'>('home');

  // Estado para guardar la cuenta seleccionada
  const [selectedAccount, setSelectedAccount] = useState<Cuenta | null>(null);

  // Función para cambiar de pantalla
  const navigateTo = (screen: 'home' | 'inicio' | 'formulario' | 'detalleCuenta' | 'estadisticas' | 'charts') => {
    setCurrentScreen(screen);
  };

  // Función para navegar al detalle de una cuenta
  const navigateToAccountDetail = (cuenta: Cuenta) => {
    setSelectedAccount(cuenta);
    setCurrentScreen('detalleCuenta');
  };

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [ocrDataFromPreview, setOcrDataFromPreview] = useState<any | null>(null);

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de cámara denegado');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (!uri) return;
      setPreviewUri(uri);
      setCurrentScreen('photoPreview');
    } catch (e) {
      console.error('openCamera error', e);
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso a galería denegado');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (!uri) return;
      setPreviewUri(uri);
      setCurrentScreen('photoPreview');
    } catch (e) {
      console.error('openGallery error', e);
    }
  };

  return (
    <SafeAreaProvider>
      {/* Renderizar la pantalla según el estado */}

      {currentScreen === 'home' && (
        <Home
          onPressAdd={() => navigateTo('inicio')}
          onPressAccount={navigateToAccountDetail}
          onPressEstadisticas={() => navigateTo('estadisticas')}
          onPressCharts={() => navigateTo('charts')}
        />
      )}
      
      {currentScreen === 'inicio' && (
        <Inicio 
          onPressManual={() => navigateTo('formulario')}
          onBack={() => navigateTo('home')}
          onPressCamera={openCamera}
          onPressGallery={openGallery}
        />
      )}
      {currentScreen === 'formulario' ? (
        <Formulario onBack={() => navigateTo('home')} ocrData={ocrDataFromPreview} />
      ) : null}

      {currentScreen === 'photoPreview' && previewUri && (
        <PhotoPreview
          uri={previewUri}
          onBack={() => {
            setPreviewUri(null);
            setCurrentScreen('inicio');
          }}
          onOcrResult={(data: any) => {
            setOcrDataFromPreview(data);
            setPreviewUri(null);
            setCurrentScreen('formulario');
          }}
        />
      )}
      
      {currentScreen === 'detalleCuenta' && selectedAccount && (
        <DetalleCuenta
          cuenta={selectedAccount}
          onBack={() => navigateTo('home')}
          onPressAdd={() => navigateTo('inicio')}
          onPressHome={() => navigateTo('home')}
          onPressEstadisticas={() => navigateTo('estadisticas')}
          onPressCharts={() => navigateTo('charts')}
        />
      )}

      {currentScreen === 'estadisticas' && (
        <Estadisticas
          onBack={() => navigateTo('home')}
          onPressAdd={() => navigateTo('inicio')}
          onPressHome={() => navigateTo('home')}
          onPressCharts={() => navigateTo('charts')}
        />
      )}

      {currentScreen === 'charts' && (
        <ChartsScreen
          onBack={() => navigateTo('home')}
          onPressAdd={() => navigateTo('inicio')}
          onPressHome={() => navigateTo('home')}
          onPressEstadisticas={() => navigateTo('estadisticas')}
        />
      )}
    </SafeAreaProvider>
  );
}