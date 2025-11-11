// import * as WebBrowser from "expo-web-browser";
// import * as Google from "expo-auth-session/providers/google";
// import * as AuthSession from "expo-auth-session";
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // signInWithCredential,
  signOut,
  // GoogleAuthProvider,
} from "firebase/auth";
// import { useEffect } from "react";



// WebBrowser.maybeCompleteAuthSession();

// Crear cuenta con email
export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Iniciar sesión con email
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Cerrar sesión
export const logOut = () => {
  return signOut(auth);
};


