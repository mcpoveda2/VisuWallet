// App.tsx
// App.tsx

import 'global.css';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from 'components/Home';
import Inicio from 'components/Inicio';
import Formulario from 'components/Formulario';
import DetalleCuenta from 'components/DetalleCuenta';
import Estadisticas from 'components/Estadisticas';
import ChartsScreen from 'components/ChartsScreen';
import Perfil from 'components/Perfil';

import { Cuenta } from './types';

export default function App() {
  // Estado para controlar qué pantalla mostrar
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'inicio' | 'formulario' | 'detalleCuenta' | 'estadisticas' | 'charts' | 'perfil'
  >('home');

  // Estado para guardar la cuenta seleccionada
  const [selectedAccount, setSelectedAccount] = useState<Cuenta | null>(null);

  // Función para cambiar de pantalla
  const navigateTo = (
    screen: 'home' | 'inicio' | 'formulario' | 'detalleCuenta' | 'estadisticas' | 'charts' | 'perfil'
  ) => {
    setCurrentScreen(screen);
  };

  // Función para navegar al detalle de una cuenta
  const navigateToAccountDetail = (cuenta: Cuenta) => {
    setSelectedAccount(cuenta);
    setCurrentScreen('detalleCuenta');
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
          onPressHome={() => navigateTo('home')}
          onPressPerfil={() => navigateTo('perfil')}
        />
      )}

      {currentScreen === 'inicio' && (
        <Inicio onPressManual={() => navigateTo('formulario')} onBack={() => navigateTo('home')} />
      )}
      {currentScreen === 'formulario' ? <Formulario onBack={() => navigateTo('home')} /> : null}

      {currentScreen === 'detalleCuenta' && selectedAccount && (
        <DetalleCuenta cuenta={selectedAccount} onBack={() => navigateTo('home')} />
      )}

      {currentScreen === 'estadisticas' && (
        <Estadisticas
          onBack={() => navigateTo('home')}
          onPressAdd={() => navigateTo('inicio')}
          onPressHome={() => navigateTo('home')}
          onPressCharts={() => navigateTo('charts')}
          onPressPerfil={() => navigateTo('perfil')}
        />
      )}

      {currentScreen === 'charts' && (
        <ChartsScreen
          onBack={() => navigateTo('home')}
          onPressAdd={() => navigateTo('inicio')}
          onPressHome={() => navigateTo('home')}
          onPressEstadisticas={() => navigateTo('estadisticas')}
          onPressPerfil={() => navigateTo('perfil')}
        />
      )}

      {currentScreen === 'perfil' && (
        <Perfil onBack={() => navigateTo('home')} />
      )}
    </SafeAreaProvider>
  );
}
