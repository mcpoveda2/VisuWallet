// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";



const firebaseConfig = {
  apiKey: "AIzaSyBAyoohTHVBz3bZFmRiDb6s80D2hBeMSfs",
  authDomain: "visuwallet.firebaseapp.com",
  projectId: "visuwallet",
  storageBucket: "visuwallet.firebasestorage.app",
  messagingSenderId: "410749935369",
  appId: "1:410749935369:web:5d6e1ac0ff306ea26cfdd8",
  measurementId: "G-KFVKWGVXD2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

