import React from 'react';
import { View, Text } from 'react-native';
// import { ProgressBar } from 'react-native-paper';

export default function Perfil() {
  const totalBalance = 120.4;
  const totalAssets = 120.12;
  const totalMoney = 0.28;
  const lockedAssets = 0.0;

  return (
    <View className="flex-1 bg-[#0B1120] px-6 pt-16">
      {/* Título */}
      <Text className="mb-6 text-3xl font-bold text-white">Portfolio</Text>

      {/* Total Balance */}
      <View className="mb-10 items-center">
        <Text className="mb-1 text-4xl font-bold text-indigo-400">${totalBalance.toFixed(2)}</Text>
        <Text className="text-base text-gray-400">Total balance</Text>
      </View>

      {/* My Account */}
      <View className="rounded-2xl bg-[#111827] p-6">
        <Text className="mb-4 text-base text-gray-400">My account</Text>

        {/* Total assets */}
        <View className="mb-4">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-white">Total assets</Text>
            <Text className="font-semibold text-white">${totalAssets.toFixed(2)}</Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
            <View
              className="h-2 rounded-full bg-indigo-500"
              style={{ width: `${(totalAssets / totalBalance) * 100}%` }}
            />
          </View>
        </View>

        {/* Total money */}
        <View className="mb-4">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-gray-300">Total money</Text>
            <Text className="text-gray-300">${totalMoney.toFixed(2)}</Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
            <View
              className="h-2 rounded-full bg-indigo-400"
              style={{ width: `${(totalMoney / totalBalance) * 100}%` }}
            />
          </View>
        </View>

        {/* Locked assets */}
        <View>
          <View className="mb-1 flex-row justify-between">
            <Text className="text-gray-300">Locked assets</Text>
            <Text className="text-gray-300">${lockedAssets.toFixed(2)}</Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
            <View
              className="h-2 rounded-full bg-zinc-500"
              style={{ width: `${(lockedAssets / totalBalance) * 100}%` }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
