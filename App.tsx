import { StatusBar } from 'expo-status-bar';

import './global.css';
import AppNavigator from 'navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      {/* <ScreenContent title="Home" path="App.tsx"></ScreenContent> */}
      <AppNavigator />
    </>
  );
}
