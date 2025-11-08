import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import app from './utils/firebase';
import { StyleSheet } from 'react-native';
import './global.css';

export default function App() {


  return (
    <>
      <ScreenContent title="Home" path="App.tsx"></ScreenContent>
      <StatusBar style="auto" />
    </>
  );
}
