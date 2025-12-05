import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ensureAnonymousSignIn, signInWithEmail, signUpWithEmail } from '../utils/firebase';
import { upsertUser } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

type LoginProps = {
  onContinue: () => void;
};

export default function Login({ onContinue }: LoginProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAnon = async () => {
    try {
      await ensureAnonymousSignIn();
      onContinue();
    } catch {
      setError('Fallo al continuar como invitado');
    }
  };

  const handleEmailAuth = async () => {
    setError(null);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        const nameTrim = displayName.trim();
        const phoneTrim = phone.trim();
        if (!nameTrim) { setError('El nombre es obligatorio'); return; }
        if (!phoneTrim) { setError('El número de celular es obligatorio'); return; }
        const u = await signUpWithEmail(email.trim(), password);
        try {
          await upsertUser({ uid: u.uid, email: u.email ?? undefined, displayName: nameTrim, phone: phoneTrim, providerId: 'password' });
        } catch {}
      }
      onContinue();
    } catch (e: any) {
      setError(e?.message || 'Error de autenticación');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black p-safe m-safe">
      <View className="flex-1 px-6">
        <View className="items-center mt-10 mb-8">
          <View className="w-16 h-16 bg-violet-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-violet-900">
            <MaterialCommunityIcons name="wallet" size={32} color="white" />
          </View>
          <Text className="text-white text-3xl font-extrabold tracking-tight">VisuWallet</Text>
          <Text className="text-neutral-400 text-sm mt-2">{mode==='login' ? 'Bienvenido de vuelta' : 'Crear una nueva cuenta'}</Text>
        </View>

        <View className="bg-neutral-900 rounded-2xl p-5 shadow-lg shadow-black/50">
          <View className="flex-row bg-neutral-800 rounded-xl p-1 mb-5">
            <TouchableOpacity onPress={() => setMode('login')} className={`flex-1 rounded-lg py-2 items-center justify-center ${mode==='login' ? 'bg-neutral-700' : ''}`}>
              <Text className={`${mode==='login' ? 'text-white' : 'text-neutral-400'} font-medium`}>Ingresar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('signup')} className={`flex-1 rounded-lg py-2 items-center justify-center ${mode==='signup' ? 'bg-neutral-700' : ''}`}>
              <Text className={`${mode==='signup' ? 'text-white' : 'text-neutral-400'} font-medium`}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>

          <View className="w-full mb-4">
            <Text className="text-neutral-400 text-xs mb-2">Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" className="bg-neutral-800 text-white px-4 py-3 rounded-xl" />
          </View>
          <View className="w-full mb-4">
            <Text className="text-neutral-400 text-xs mb-2">Contraseña</Text>
            <View className="flex-row items-center bg-neutral-800 rounded-xl">
              <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} className="flex-1 text-white px-4 py-3" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
          {error && (
            <View className="bg-red-900/40 border border-red-700 rounded-xl px-3 py-2 mb-3">
              <Text className="text-red-300 text-sm">{error}</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleEmailAuth} activeOpacity={0.8} className="bg-violet-600 py-4 rounded-2xl items-center shadow-lg shadow-violet-800 w-full">
            <Text className="text-white text-lg font-semibold">{mode==='login' ? 'Entrar' : 'Registrarse'}</Text>
          </TouchableOpacity>

          {mode==='signup' && (
            <>
              <View className="w-full mt-5 mb-4">
                <Text className="text-neutral-400 text-xs mb-2">Nombre</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" placeholderTextColor="#9CA3AF" className="bg-neutral-800 text-white px-4 py-3 rounded-xl" />
              </View>
              <View className="w-full mb-2">
                <Text className="text-neutral-400 text-xs mb-2">Número de celular</Text>
                <TextInput value={phone} onChangeText={setPhone} placeholder="Ej. 09xxxxxxxx" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" className="bg-neutral-800 text-white px-4 py-3 rounded-xl" />
              </View>
            </>
          )}
        </View>

        <View className="w-full mt-6">
          <TouchableOpacity onPress={handleAnon} activeOpacity={0.8} className="bg-neutral-800 py-4 rounded-2xl items-center shadow-lg shadow-neutral-900 w-full">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="account-off" size={20} color="white" />
              <Text className="text-white text-lg font-semibold">Continuar como invitado</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


