import { ActivityIndicator, Pressable, Text } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
}

export default function Button({
  children,
  onPress,
  disabled,
  loading,
  fullWidth,
  variant = "primary",
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 px-6 py-4 rounded-2xl ${
        fullWidth ? "w-full" : ""
      } ${
        variant === "primary"
          ? isDisabled
            ? "bg-gold-light"
            : "bg-gold"
          : "bg-transparent border border-border"
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#7B7268"} />
      ) : (
        <Text
          className={`text-base font-semibold ${
            variant === "primary" ? "text-white" : "text-secondary"
          }`}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
