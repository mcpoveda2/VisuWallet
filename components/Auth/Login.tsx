import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import { signIn } from '../../firebase/authService';

interface LoginProps {
  onLoginSuccess?: () => void;
  onSignup?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  // Google login removed

  return (
    <View className="flex-1 items-center justify-center bg-zinc-900 p-8">
      <View className="w-full max-w-sm rounded-2xl bg-zinc-800 p-8 shadow-2xl shadow-black/50">
        <Text className="mb-8 text-center text-4xl font-bold text-white">Bienvenido</Text>

        <TextInput
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-700 p-4 text-white placeholder-zinc-400 focus:border-teal-500"
          placeholder="Correo electrónico"
          placeholderTextColor="#A1A1AA"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="mb-8 w-full rounded-xl border border-zinc-700 bg-zinc-700 p-4 text-white placeholder-zinc-400 focus:border-teal-500"
          placeholder="Contraseña"
          placeholderTextColor="#A1A1AA"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={handleLogin}
          className="mb-4 w-full rounded-xl bg-teal-500 py-4 shadow-lg shadow-teal-500/40 active:opacity-80">
          <Text className="text-center text-lg font-bold text-white">Ingresar</Text>
        </TouchableOpacity>

        {/* Google Sign-In removed */}

        <TouchableOpacity onPress={() => onSignup && onSignup()} className="mt-8">
          <Text className="text-center text-zinc-400">
            ¿No tienes cuenta?
            <Text className="font-semibold text-teal-400"> Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
