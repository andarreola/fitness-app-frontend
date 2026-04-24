import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchRecentWorkoutSessions } from "@/lib/workouts";
import type { WorkoutSessionSummary } from "@/lib/workout-types";

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

function formatCount(count: number, isLegacy: boolean) {
  if (isLegacy) return "Legacy session";
  return `${count} planned exercise${count === 1 ? "" : "s"}`;
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
  const [sessions, setSessions] = useState<WorkoutSessionSummary[]>([]);

  const loadSessions = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchRecentWorkoutSessions(50);
      setSessions(rows);
    } catch (err: any) {
      const message = err?.message ?? "Could not load workouts.";
      setError(message);
      setSessions([]);
      if (message.toLowerCase().includes("signed in")) {
        router.replace("/(auth)/sign-in");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        Completed sessions are shown first, with active and legacy sessions after.
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
            Start a workout from Home. New and completed sessions will show up here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {sessions.map((row) => (
            <Pressable
              key={row.id}
              onPress={() =>
                router.push({
                  pathname: "/workout",
                  params: { sessionId: row.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pressed ? palette.chipBg : palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.contextName, { color: palette.text }]}>
                {row.contextName}
              </Text>
              <Text style={[styles.sessionTime, { color: palette.text }]}>
                {formatSessionTime(row.startedAt)}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                  <Text style={[styles.chipText, { color: palette.text }]}>
                    {formatStatus(row.status)}
                  </Text>
                </View>
                {row.experienceLevelName ? (
                  <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                    <Text style={[styles.chipText, { color: palette.text }]}>
                      {row.experienceLevelName}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.sessionMeta, { color: palette.muted }]}>
                {formatCount(row.plannedExerciseCount, row.isLegacy)}
              </Text>
            </Pressable>
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
  contextName: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
  sessionTime: { fontSize: 14, fontWeight: "700" },
  sessionMeta: { fontSize: 13, marginTop: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
});
