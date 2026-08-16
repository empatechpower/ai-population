import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

interface RadioCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
}

export default function RadioCard({
  label,
  description,
  selected,
  onSelect,
  icon,
}: RadioCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3.5 px-[18px] py-4 rounded-2xl mb-3 border ${
        selected ? "bg-gold-light border-gold" : "bg-elevated border-border"
      }`}
      style={{ borderWidth: selected ? 1.5 : 1.5 }}
    >
      {icon && (
        <View
          className={`w-9 h-9 rounded-[10px] items-center justify-center ${
            selected ? "bg-gold" : "bg-section"
          }`}
        >
          {icon}
        </View>
      )}
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-charcoal leading-5">{label}</Text>
        {description && (
          <Text className="text-[13px] text-muted mt-0.5 leading-[18px]">{description}</Text>
        )}
      </View>
      {selected && (
        <View className="w-[22px] h-[22px] rounded-full bg-gold items-center justify-center">
          <Check size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}
