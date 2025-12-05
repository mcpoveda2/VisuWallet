import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, ensureAnonymousSignIn } from '../utils/firebase';
import { upsertUser } from '../services/firestore';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure there's at least an anonymous session
    ensureAnonymousSignIn().catch(() => {});

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsLoading(false);
      if (u) {
        try {
          await upsertUser({
            uid: u.uid,
            email: u.email ?? undefined,
            displayName: u.displayName ?? undefined,
            photoURL: u.photoURL ?? undefined,
            providerId: u.providerData?.[0]?.providerId ?? 'anonymous',
          });
        } catch (err) {
          // swallow errors to avoid blocking the app
        }
      }
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
