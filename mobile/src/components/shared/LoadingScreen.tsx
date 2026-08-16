import { ActivityIndicator, Image, Text, View } from "react-native";

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <View className="flex-1 bg-bg items-center justify-center gap-4 px-6">
      <Image source={require("@/assets/images/logo-icon.png")} style={{ width: 48, height: 48 }} />
      <ActivityIndicator color="#D4B06A" />
      <Text className="text-sm text-muted text-center">{message}</Text>
    </View>
  );
}
