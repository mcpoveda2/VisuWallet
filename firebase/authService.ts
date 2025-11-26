import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";




// WebBrowser.maybeCompleteAuthSession();

// Crear cuenta con email
export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Iniciar sesión con email
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Google sign-in removed (email/password only)

// Cerrar sesión
export const logOut = () => {
  return signOut(auth);
};


