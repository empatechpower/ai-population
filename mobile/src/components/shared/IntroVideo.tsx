import { Pressable, StatusBar, Text, View, useWindowDimensions } from "react-native";
import { useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";

const introSource = require("../../../assets/videos/intro.mp4");

export default function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer(introSource, (p) => {
    p.play();
  });

  useEventListener(player, "playToEnd", onFinish);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable
        onPress={onFinish}
        hitSlop={12}
        style={{
          position: "absolute",
          top: 56,
          right: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Skip</Text>
      </Pressable>
    </View>
  );
}
