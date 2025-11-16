import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { signIn, signInWithGoogle } from '../../firebase/authService';
import { useNavigation } from '@react-navigation/native';
import { GoogleSigninButton, GoogleSignin } from 'react-native-google-signin';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  const googleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      if (idToken) {
        await signInWithGoogle(idToken);
        // AppNavigator detectará el cambio en auth y redirigirá automáticamente
      } else {
        Alert.alert('❌ Error', 'No se recibió el token de Google');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Error', 'No se pudo iniciar sesión con Google');
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['profile', 'email'],
      webClientId: '410749935369-hkpavm51iv77vql62pa5ak0jmrup026m.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

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

        <GoogleSigninButton
          style={{ width: '100%', height: 50, marginBottom: 16 }}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Light}
          onPress={() => googleLogin()}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)} className="mt-8">
          <Text className="text-center text-zinc-400">
            ¿No tienes cuenta?
            <Text className="font-semibold text-teal-400"> Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
