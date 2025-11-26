import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { db } from "utils/firebase.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";




// WebBrowser.maybeCompleteAuthSession();

// Crear cuenta con email
export const signUp = async (
  email: string,
  password: string,
  displayName?: string,
  phone?: string
) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  const user = res.user;

  if (displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (e) {
      console.warn('updateProfile failed', e);
    }
  }

  const userRef = doc(db, 'users', user.uid);
  await setDoc(
    userRef,
    {
      displayName: displayName ?? '',
      phone: phone ?? '',
      createdAt: serverTimestamp(),
      cuentas: [],
      cuentasIds: [],
    },
    { merge: true }
  );

  return res;
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


