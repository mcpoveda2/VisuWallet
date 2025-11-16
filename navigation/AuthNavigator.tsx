import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Signup from '../views/Auth/Signup';
import Login from '../views/Auth/Login';

export type AuthStackParamList = {
  Signup: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Signup" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
}
