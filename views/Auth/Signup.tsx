import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signUp } from '../../firebase/authService';

type SignupScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas son distintas');
      return;
    }

    try {
      await signUp(email, password);
      // Una vez creado el usuario, AppNavigator detectará el cambio de auth y redirigirá a Main
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    // <View style={{ padding: 20 }}>
    //   <TextInput
    //     placeholder="Email"
    //     value={email}
    //     onChangeText={setEmail}
    //     keyboardType="email-address"
    //     autoCapitalize="none"
    //   />
    //   <TextInput
    //     placeholder="Password"
    //     value={password}
    //     onChangeText={setPassword}
    //     secureTextEntry
    //   />
    //   <TextInput
    //     placeholder="Confirm Password"
    //     value={confirmPassword}
    //     onChangeText={setConfirmPassword}
    //     secureTextEntry
    //   />

    //   {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

    //   <Button title="Sign Up" onPress={handleSignup} />
    //   <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
    // </View>

    <View className="flex-1 items-center justify-center bg-zinc-900 p-8">
      {/* Card Contenedora */}
      <View className="w-full max-w-sm rounded-2xl bg-zinc-800 p-8 shadow-2xl shadow-black/50">
        <Text className="mb-8 text-center text-4xl font-bold text-white">Regístrate</Text>

        {/* Input: Correo */}
        <TextInput
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-700 p-4 text-white placeholder-zinc-400 focus:border-teal-500"
          placeholder="Correo electrónico"
          placeholderTextColor="#A1A1AA"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Input: Contraseña */}
        <TextInput
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-700 p-4 text-white placeholder-zinc-400 focus:border-teal-500"
          placeholder="Contraseña"
          placeholderTextColor="#A1A1AA"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Input: Confirmar Contraseña */}
        <TextInput
          className="mb-8 w-full rounded-xl border border-zinc-700 bg-zinc-700 p-4 text-white placeholder-zinc-400 focus:border-teal-500"
          placeholder="Confirmar Contraseña"
          placeholderTextColor="#A1A1AA"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Mensaje de Error (Estilizado) */}
        {error ? (
          <View className="mb-4 rounded-xl border border-red-500 bg-red-800/20 p-3">
            <Text className="text-center font-medium text-red-400">{error}</Text>
          </View>
        ) : null}

        {/* Botón Principal: Sign Up */}
        <TouchableOpacity
          onPress={handleSignup}
          className="mb-6 w-full rounded-xl bg-teal-500 py-4 shadow-lg shadow-teal-500/40 active:opacity-80">
          <Text className="text-center text-lg font-bold text-white">Crear Cuenta</Text>
        </TouchableOpacity>

        {/* Enlace de Login */}
        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} className="mt-4">
          <Text className="text-center text-zinc-400">
            ¿Ya tienes cuenta?
            <Text className="font-semibold text-teal-400"> Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
