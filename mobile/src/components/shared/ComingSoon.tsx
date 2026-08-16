import { Text, View } from "react-native";

export default function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Text className="font-serif text-2xl text-charcoal mb-3 text-center">{title}</Text>
      <Text className="text-secondary text-sm text-center leading-6">{subtitle}</Text>
    </View>
  );
}
