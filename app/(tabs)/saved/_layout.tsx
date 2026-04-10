import { Stack } from "expo-router";

export default function SavedLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Saved Hikes" }} />
      <Stack.Screen name="[slug]" options={{ title: "Offline Hike" }} />
    </Stack>
  );
}
