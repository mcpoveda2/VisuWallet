import ChartsScreen from './components/ChartsScreen';
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
  return (
    <>
      <ChartsScreen />
      <StatusBar style="auto" />
    </>
  );
}
