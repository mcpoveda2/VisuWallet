// import { ScreenContent } from 'components/ScreenContent';
// import { StatusBar } from 'expo-status-bar';

// import './global.css';

// export default function App() {
//   return (
//     <>
//       <ScreenContent title="Home" path="App.tsx"></ScreenContent>
//       <StatusBar style="auto" />
//     </>
//   );
// }

import "global.css";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Home from "components/Home";
import Inicio from "components/Inicio";
import Formulario from "components/Formulario";

export default function App() {
  // Estado para controlar qué pantalla mostrar
  const [currentScreen, setCurrentScreen] = useState<'home' | 'inicio' | 'formulario'>('home');

  // Función para cambiar de pantalla
  const navigateTo = (screen: 'home' | 'inicio' | 'formulario') => {
    setCurrentScreen(screen);
  };

  return (
    <SafeAreaProvider>
      {/* Renderizar la pantalla según el estado */}
      {currentScreen === 'home' && (
        <Home onPressAdd={() => navigateTo('inicio')} />
      )}
      
      {currentScreen === 'inicio' && (
        <Inicio 
          onPressManual={() => navigateTo('formulario')}
          onBack={() => navigateTo('home')}
        />
      )}
      
      {currentScreen === 'formulario' && (
        <Formulario onBack={() => navigateTo('home')} />
      )}
    </SafeAreaProvider>
  );
}