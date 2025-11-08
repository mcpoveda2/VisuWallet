import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence} from 'firebase/auth/react-native';
import React from 'react';
const firebaseConfig = {
  apiKey: "AIzaSyCizNbDECCLXJyBimg1Q2UFalrguFdQ614",
  authDomain: "pre-taws.firebaseapp.com",
  databaseURL: "https://pre-taws-default-rtdb.firebaseio.com",
  projectId: "pre-taws",
  storageBucket: "pre-taws.firebasestorage.app",
  messagingSenderId: "787398838709",
  appId: "1:787398838709:web:1e6ebc76530cfa47b9b1fc",
  measurementId: "G-51P1KVVG6H"
};
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;
export { auth };