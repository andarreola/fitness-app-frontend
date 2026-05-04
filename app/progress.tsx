import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { scrollContentInsetPadding } from "@/lib/scroll-padding";
import { supabase } from "@/lib/supabase";
import { fetchRecentWorkoutSessions } from "@/lib/workouts";
import type { WorkoutSessionSummary } from "@/lib/workout-types";

type BmiEntry = {
  id: string;
  bmi: number;
  weight_kg: number | null;
  height_cm: number | null;
  category: string | null;
  created_at: string;
};

type WorkoutSession = {
  id: string;
  started_at: string | null;
  completed_at: string | null;
  status: string | null;
};

type WorkoutSet = {
  id: string;
  session_id: string | null;
  exercise_id: string | null;
  actual_reps: number | null;
  actual_weight: number | null;
  created_at: string | null;
};

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
}

function isWithinLastDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const msAgo = Date.now() - date.getTime();
  return msAgo <= days * 24 * 60 * 60 * 1000;
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

function toDayKey(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dayKey: string, days: number) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return toDayKey(date.toISOString()) ?? dayKey;
}

function appendError(prev: string | null, message: string) {
  return prev ? `${prev}\n${message}` : message;
}

function estimateSessionDurationMinutes(exerciseCount: number) {
  return Math.max(20, exerciseCount * 8);
}

function estimateSessionCalories(exerciseCount: number) {
  return Math.max(180, exerciseCount * 70);
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const palette = {
    background: theme.ui.screen,
    surface: theme.ui.surface,
    border: theme.ui.border,
    text: theme.ui.textPrimary,
    muted: theme.ui.textSecondary,
    accent: theme.ui.highlight,
    accentText: "#0A1A34",
    rowHighlight: theme.ui.elevated,
    chipBg: theme.ui.accentSoft,
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<BmiEntry[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSessionSummary[]>([]);

  const loadData = useCallback(async () => {
    setError(null);
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();
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

    const { data, error: bmiErr } = await supabase
      .from("bmi_entries")
      .select("id, bmi, weight_kg, height_cm, category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (bmiErr) {
      setError(bmiErr.message);
    } else {
      setEntries((data ?? []) as BmiEntry[]);
    }

    const { data: sessionRows, error: sessionsErr } = await supabase
      .from("workout_sessions")
      .select("id, started_at, completed_at, status")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(365);

    if (sessionsErr) {
      setError((prev) => appendError(prev, sessionsErr.message));
    } else {
      const normalizedSessions = (sessionRows ?? []) as WorkoutSession[];
      setSessions(normalizedSessions);

      const sessionIds = normalizedSessions.map((s) => s.id);
      if (sessionIds.length) {
        const { data: setRows, error: setsErr } = await supabase
          .from("workout_sets")
          .select(
            "id, session_id, exercise_id, actual_reps, actual_weight, created_at",
          )
          .in("session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(1000);

        if (setsErr) {
          setError((prev) => appendError(prev, setsErr.message));
        } else {
          const normalizedSets = (setRows ?? []) as WorkoutSet[];
          setWorkoutSets(normalizedSets);
        }
      } else {
        setWorkoutSets([]);
      }
    }

    try {
      const recent = await fetchRecentWorkoutSessions(5);
      setRecentSessions(recent);
    } catch {
      setRecentSessions([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const metrics = useMemo(() => {
    if (!entries.length) {
      return {
        latestBmi: null as number | null,
        delta30d: null as number | null,
        currentCategory: null as string | null,
      };
    }

    const latest = entries[0];
    const thirtyDayWindow = entries.filter((entry) =>
      isWithinLastDays(entry.created_at, 30),
    );
    const oldestInWindow = thirtyDayWindow[thirtyDayWindow.length - 1];
    const delta30d =
      oldestInWindow && latest
        ? Number((latest.bmi - oldestInWindow.bmi).toFixed(1))
        : null;

    return {
      latestBmi: latest.bmi,
      delta30d,
      currentCategory: latest.category ?? getBmiCategory(latest.bmi),
    };
  }, [entries]);

  const workoutMetrics = useMemo(() => {
    const datedSessions = sessions.filter(
      (s) => !!s.started_at,
    ) as (WorkoutSession & {
      started_at: string;
    })[];

    if (!datedSessions.length) {
      return {
        workoutsThisWeek: 0,
        totalWorkouts: 0,
        currentStreak: 0,
      };
    }

    const sessionsThisWeek = datedSessions.filter((s) =>
      isWithinLastDays(s.started_at, 7),
    ).length;
    const totalWorkouts = datedSessions.length;

    const daySet = new Set(
      datedSessions
        .map((s) => toDayKey(s.started_at))
        .filter((v): v is string => !!v),
    );
    const sortedDays = Array.from(daySet).sort((a, b) => (a < b ? 1 : -1));

    let streak = 0;
    let cursor = sortedDays[0];
    while (cursor && daySet.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return {
      workoutsThisWeek: sessionsThisWeek,
      totalWorkouts,
      currentStreak: streak,
    };
  }, [sessions]);

  const kpis = useMemo(() => {
    const totalHours = sessions.reduce((sum, session) => {
      if (!session.started_at || !session.completed_at) return sum;
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.completed_at).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum;
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);

    const estimatedCaloriesFromSets = workoutSets.reduce((sum, set) => {
      if (set.actual_reps === null || set.actual_weight === null) return sum;
      return sum + set.actual_reps * set.actual_weight * 0.05;
    }, 0);

    const caloriesBurned = Math.round(
      estimatedCaloriesFromSets > 0
        ? estimatedCaloriesFromSets
        : workoutMetrics.totalWorkouts * 250,
    );

    return {
      totalWorkouts: workoutMetrics.totalWorkouts,
      totalHours: Math.round(totalHours),
      caloriesBurned,
      currentStreak: workoutMetrics.currentStreak,
    };
  }, [sessions, workoutSets, workoutMetrics]);

  const { paddingTop: scrollTop, paddingBottom: scrollBottom } =
    scrollContentInsetPadding(insets, 4, 16);

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: palette.background,
            paddingTop: scrollTop,
            paddingBottom: scrollBottom,
          },
        ]}
      >
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: scrollTop,
          paddingBottom: scrollBottom,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            tintColor={palette.accent}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={[
              styles.backButton,
              { borderColor: palette.border, backgroundColor: palette.surface },
            ]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={18} color={palette.text} />
          </Pressable>
          <Text style={[styles.title, { color: palette.text }]}>Progress</Text>
        </View>

        {error ? (
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={{ color: palette.text, fontWeight: "700" }}>
              Could not load progress
            </Text>
            <Text style={{ color: palette.muted, marginTop: 6 }}>{error}</Text>
            <Pressable
              style={[styles.retryBtn, { borderColor: palette.accent }]}
              onPress={loadData}
            >
              <Text style={{ color: palette.accent, fontWeight: "700" }}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <KpiCard iconName="figure.run" label="Total Workouts" value={String(kpis.totalWorkouts)} palette={palette} />
          <KpiCard iconName="clock.fill" label="Total Hours" value={String(kpis.totalHours)} palette={palette} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard iconName="flame.fill" label="Calories Burned" value={String(kpis.caloriesBurned)} palette={palette} />
          <KpiCard iconName="trophy.fill" label="Current Streak" value={`${kpis.currentStreak} days`} palette={palette} />
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Recent Workouts</Text>
          {!recentSessions.length ? (
            <Text style={{ color: palette.muted }}>
              No workouts yet. Complete a workout session to populate this list.
            </Text>
          ) : (
            recentSessions.map((session) => (
              <View
                key={session.id}
                style={[
                  styles.milestone,
                  {
                    backgroundColor: palette.rowHighlight,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.workoutHeaderRow}>
                  <Text style={{ color: palette.text, fontWeight: "800", flex: 1 }}>
                    {session.contextName}
                  </Text>
                  <Text style={{ color: palette.muted, fontWeight: "700" }}>
                    {session.startedAt ? formatDateLabel(session.startedAt) : "No date"}
                  </Text>
                </View>
                <Text style={{ color: palette.muted, marginTop: 4 }}>
                  {session.experienceLevelName ?? "General"} • {session.plannedExerciseCount} exercises
                </Text>
                <View style={styles.metaStatsRow}>
                  <View style={styles.metaStat}>
                    <IconSymbol name="clock.fill" size={12} color={palette.muted} />
                    <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>
                      {estimateSessionDurationMinutes(session.plannedExerciseCount)} min
                    </Text>
                  </View>
                  <View style={styles.metaStat}>
                    <IconSymbol name="flame.fill" size={12} color={palette.muted} />
                    <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>
                      {estimateSessionCalories(session.plannedExerciseCount)} cal
                    </Text>
                  </View>
                </View>
                <View style={styles.metaChipRow}>
                  <View style={[styles.metaChip, { backgroundColor: palette.chipBg }]}>
                    <Text style={{ color: palette.text, fontWeight: "700", fontSize: 12 }}>
                      {session.status ?? "in_progress"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>BMI Snapshot</Text>
          <Text style={{ color: palette.text, fontWeight: "700" }}>
            Current BMI: {metrics.latestBmi ? metrics.latestBmi.toFixed(1) : "--"}
          </Text>
          <Text style={{ color: palette.muted, marginTop: 4 }}>
            30-day change:{" "}
            {metrics.delta30d === null
              ? "--"
              : `${metrics.delta30d > 0 ? "+" : ""}${metrics.delta30d}`}
          </Text>
          <Text style={{ color: palette.muted, marginTop: 2 }}>
            Category: {metrics.currentCategory ?? "No category yet"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function KpiCard({
  iconName,
  label,
  value,
  subtitle,
  palette,
}: {
  iconName: "figure.run" | "clock.fill" | "flame.fill" | "trophy.fill";
  label: string;
  value: string;
  subtitle?: string;
  palette: { surface: string; border: string; text: string; muted: string };
}) {
  return (
    <View
      style={[
        styles.kpiCard,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <IconSymbol name={iconName} size={20} color={palette.muted} />
      <Text style={{ color: palette.muted, fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          color: palette.text,
          fontSize: 24,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text style={{ color: palette.muted, marginTop: 4, fontWeight: "600" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: {
    borderWidth: 1,
    borderRadius: 17,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  milestone: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  workoutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaChipRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  metaStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  metaStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
