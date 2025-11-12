import React from 'react';
import { View, Image, Button } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
interface PhotoPreviewProps {
  uri: string | null;
  onBack: () => void;
}

export default function PhotoPreview({ uri, onBack }: PhotoPreviewProps) {
  return (
    <SafeAreaView className="flex-1 bg-black p-safe m-safe">
      <View className="flex-1 items-center justify-center p-4">
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '80%' }}
            resizeMode="contain"
          />
        ) : (
          <View />
        )}
      </View>

      <View className="p-4">
        <Button title="Volver" onPress={onBack} />
      </View>
    </SafeAreaView>
  );
}