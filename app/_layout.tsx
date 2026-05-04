import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const barStyle = scheme === "dark" ? "light" : "dark";

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.ui.screen }}>
        <StatusBar style={barStyle} backgroundColor={theme.ui.screen} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { flex: 1, backgroundColor: theme.ui.screen },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
