import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

type WorkoutSessionRow = {
  id: string;
  started_at: string | null;
  status: string | null;
};

function formatSessionTime(value: string | null) {
  if (!value) return "Time not recorded";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: string | null) {
  if (!status?.trim()) return "Unknown";
  return status.replace(/_/g, " ");
}

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = useMemo(
    () => ({
      background: theme.background,
      card: isDark ? "#1C1F23" : "#F8FAFC",
      border: isDark ? "#31363F" : "#E5E7EB",
      text: theme.text,
      muted: theme.icon,
      accent: theme.tint,
      chipBg: isDark ? "#252A33" : "#EEF2F7",
    }),
    [theme, isDark],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);

  const loadSessions = useCallback(async () => {
    setError(null);
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      setError(sessionErr.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const user = sessionData.session?.user;
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      router.replace("/(auth)/sign-in");
      return;
    }

    const { data, error: fetchErr } = await supabase
      .from("workout_sessions")
      .select("id, started_at, status")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (fetchErr) {
      setError(fetchErr.message);
      setSessions([]);
    } else {
      setSessions((data ?? []) as WorkoutSessionRow[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions]),
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadSessions();
          }}
          tintColor={palette.accent}
        />
      }
    >
      <Text style={[styles.title, { color: palette.text }]}>Recent workouts</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        Latest sessions saved to your account.
      </Text>

      {error ? (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontWeight: "700" }}>Could not load workouts</Text>
          <Text style={{ color: palette.muted, marginTop: 6 }}>{error}</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontWeight: "600" }}>No workouts yet</Text>
          <Text style={{ color: palette.muted, marginTop: 6 }}>
            Start a workout from Home. Completed sessions will show up here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {sessions.map((row) => (
            <View
              key={row.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text style={[styles.sessionTime, { color: palette.text }]}>
                {formatSessionTime(row.started_at)}
              </Text>
              <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                <Text style={[styles.chipText, { color: palette.text }]}>
                  {formatStatus(row.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 32, gap: 16 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sessionTime: { fontSize: 16, fontWeight: "700" },
  chip: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
});
