import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { signIn } from '../../firebase/authService';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../../firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '410749935369-ur5k1tcc7o5825f8j9ukp2qs1fjfvqbt.apps.googleusercontent.com',
  });

  const enviarTokenalServer = async (token: string) => {
    if (!token) {
      Alert.alert('Error', 'No se recibió el token');
      return;
    }
    const credential = GoogleAuthProvider.credential(token);
    await signInWithCredential(auth, credential);
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = (response as any)?.params?.id_token || response.authentication?.idToken;
      if (idToken) {
        enviarTokenalServer(idToken);
      } else {
        Alert.alert('Error', 'No se recibió el token de Google');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo completar el inicio de sesión');
    }
  }, [response]);

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

        <TouchableOpacity
          onPress={() => promptAsync()}
          className="w-full flex-row items-center justify-center space-x-2 rounded-xl bg-white py-4 shadow-lg shadow-red-600/40 active:opacity-80">
          {/* <AntDesign name="google" size={24} color="#DB4437" /> */}
          <Image
            source={require('../../assets/logo_google.png')}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
          <Text className="text-center text-lg font-semibold text-black">Ingresar con Google</Text>
        </TouchableOpacity>

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
