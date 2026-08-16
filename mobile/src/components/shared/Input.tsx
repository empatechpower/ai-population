import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface InputProps extends TextInputProps {
  label?: string;
  isPassword?: boolean;
  error?: string;
}

export default function Input({ label, isPassword, error, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="gap-1.5 mb-5">
      {label && (
        <Text className="text-xs font-medium text-muted uppercase tracking-wider">{label}</Text>
      )}
      <View className="relative justify-center">
        <TextInput
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor="#9A9094"
          className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-charcoal ${
            error ? "border-warning" : "border-border"
          } ${isPassword ? "pr-12" : ""}`}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            className="absolute right-3"
            hitSlop={8}
          >
            {showPassword ? (
              <EyeOff size={18} color="#9A9094" />
            ) : (
              <Eye size={18} color="#9A9094" />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text className="text-xs text-warning">{error}</Text>}
    </View>
  );
}
