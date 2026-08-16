import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface InfoItem {
  icon: string;
  title: string;
  body: string;
}

interface InfoBoxProps {
  emoji: string;
  title: string;
  subtitle?: string;
  conclusion?: string;
  items: InfoItem[];
  accentColor?: string;
  defaultOpen?: boolean;
}

export default function InfoBox({
  emoji,
  title,
  subtitle,
  conclusion,
  items,
  accentColor = "#D4B06A",
  defaultOpen = false,
}: InfoBoxProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      className="bg-card rounded-[22px] border border-border overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      <Pressable onPress={() => setOpen((o) => !o)} className="px-5 py-4 flex-row items-start gap-3">
        <Text className="text-2xl mt-0.5">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-base font-semibold text-primary leading-tight">{title}</Text>
          {subtitle && (
            <Text className="text-xs text-muted mt-0.5 leading-snug font-serif italic">{subtitle}</Text>
          )}
        </View>
        <View className="mt-1">
          {open ? <ChevronUp size={16} color="#9A9094" /> : <ChevronDown size={16} color="#9A9094" />}
        </View>
      </Pressable>

      {open && (
        <View className="px-5 pb-5">
          <View className="gap-3.5">
            {items.map((item, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <Text className="text-xl mt-0.5">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-primary mb-0.5">{item.title}</Text>
                  <Text className="text-sm text-secondary leading-relaxed">{item.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {conclusion && (
            <View
              className="mt-4 px-3.5 py-3 rounded-2xl"
              style={{ backgroundColor: `${accentColor}10`, borderLeftWidth: 2, borderLeftColor: `${accentColor}40` }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor }}
              >
                Conclusion
              </Text>
              <Text className="text-sm text-secondary leading-relaxed font-serif italic">{conclusion}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
