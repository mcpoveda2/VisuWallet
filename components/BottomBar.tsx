import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

type TabItem = {
  name: string;
  component: React.ComponentType<any>;
  icon: string;
};

type BottomBarProps = {
  tabs: TabItem[];
};

export const BottomBar = ({ tabs }: BottomBarProps) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B1120',
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
      }}>
      {tabs.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name={t.icon as any} color={color} size={size} />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
