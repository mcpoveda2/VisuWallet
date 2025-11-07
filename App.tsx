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
import { SafeAreaProvider } from "react-native-safe-area-context";
 
export default function App() {
  return (
    <SafeAreaProvider> 
    
      <Inicio/>
    
    </SafeAreaProvider>
    
  );
}