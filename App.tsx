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

import "global.css"
import { Text, View } from "react-native";
import Inicio from "components/Inicio";
import Categorias from "components/Categorias";
import Formulario from "components/Formulario";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Home from "components/Home";
 
export default function App() {
  return (
    <SafeAreaProvider> 
    
      <Home/>
    
    </SafeAreaProvider>
    
  );
}