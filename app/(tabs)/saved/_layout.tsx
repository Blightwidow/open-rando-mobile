import { Stack } from "expo-router";

export default function SavedLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Saved Routes" }} />
      <Stack.Screen name="[slug]" options={{ title: "Offline Route" }} />
    </Stack>
  );
}
