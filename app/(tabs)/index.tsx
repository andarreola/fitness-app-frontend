import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = {
    background: theme.background,
    card: isDark ? "#1C1F23" : "#F8FAFC",
    cardPressed: isDark ? "#252A33" : "#EEF2F7",
    border: isDark ? "#31363F" : "#E5E7EB",
    text: theme.text,
    muted: theme.icon,
    accent: theme.tint,
    danger: "#EF4444",
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [contexts, setContexts] = useState<any[]>([]);

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

      const { data, error } = await supabase
        .from("workout_contexts")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setContexts(data || []);
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

      {/* This is for workout context */}
      <View style={{ gap: 15, marginTop: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text }}>Start a Workout</Text>
        <Text style={{ fontSize: 16, color: palette.muted }}>
          Where are you training today?
        </Text>

        {contexts.length > 0 ? (
          contexts.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/workout",
                  params: { contextId: item.id },
                })
              }
              style={({ pressed }) => ({
                padding: 20,
                borderRadius: 15,
                backgroundColor: pressed ? palette.cardPressed : palette.card,
                borderWidth: 1,
                borderColor: palette.border,
              })}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: palette.text }}>
                {item.display_name}
              </Text>
              <Text style={{ fontSize: 14, color: palette.muted, marginTop: 4 }}>
                {item.equipment_access_type?.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text
              style={{ color: palette.danger, textAlign: "center", marginBottom: 10 }}
            >
              No workout contexts found.
            </Text>
            <Button title="Try Again" color={palette.accent} onPress={loadHome} />
          </View>
        )}
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
