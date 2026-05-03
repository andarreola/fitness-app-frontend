import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const isDark = scheme === "dark";
  const palette = {
    background: theme.ui.screen,
    card: theme.ui.surface,
    cardPressed: theme.ui.optionSelected,
    border: theme.ui.border,
    text: theme.ui.textPrimary,
    muted: theme.ui.textSecondary,
    accent: theme.ui.highlight,
    accentText: "#0A1A34",
    danger: "#EF4444",
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const loadHome = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn(sessionError);
      }
      const session = sessionData.session;
      if (!session) {
        router.replace("/(auth)/sign-in");
        return;
      }

      setEmail(session.user.email ?? null);

      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profError) {
        console.warn("Home profile fetch:", profError);
      }
      setUsername(prof?.username?.trim() || null);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHome();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadHome();
          }}
          tintColor={palette.accent}
        />
      }
    >
      <View style={{ marginTop: 8, gap: 4 }}>
        <Text style={{ fontSize: 14, color: palette.muted }}>Logged in as:</Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: palette.text }}>
          {username ?? email ?? "—"}
        </Text>
        {username && email ? (
          <Text style={{ fontSize: 14, color: palette.muted }}>{email}</Text>
        ) : null}
      </View>

      <View style={{ gap: 15, marginTop: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text }}>Start a Workout</Text>
        <Text style={{ fontSize: 16, color: palette.muted }}>
          
        </Text>
        <Pressable
          onPress={() => router.push("/workout-setup")}
          style={({ pressed }) => ({
            padding: 20,
            borderRadius: 15, 
            backgroundColor: pressed ? palette.cardPressed : palette.card,
            borderWidth: 1,
            borderColor: palette.border,
            gap: 8,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <IconSymbol name="dumbbell.fill" size={20} color={palette.accent} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: palette.text }}>
              Create Workout
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: palette.muted }}>
            Select location and equipment to generate the right workout.
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogout}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.danger,
          alignItems: "center",
          marginTop: 30,
          backgroundColor: isDark ? "#23181A" : "#FFF5F5",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: palette.danger }}>
          Log Out
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
