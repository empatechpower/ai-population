import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function FertilityScoreRing({
  score,
  size = 168,
}: {
  score: number;
  size?: number;
}) {
  const sw = 11;
  const radius = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 400);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (animated / 100) * circ;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E1D6" strokeWidth={sw} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C6A769"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </Svg>
      <View className="items-center">
        <Text className="text-5xl font-semibold text-primary tracking-tight">{score}</Text>
        <Text className="text-2xs text-muted mt-1 tracking-widest uppercase">/ 100</Text>
      </View>
    </View>
  );
}
