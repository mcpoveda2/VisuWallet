import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
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

// Iniciar sesión con Google (recibe idToken de GoogleSignin)
export const signInWithGoogle = (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
};

// Cerrar sesión
export const logOut = () => {
  return signOut(auth);
};


