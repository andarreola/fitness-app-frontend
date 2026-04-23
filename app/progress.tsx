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
import { Colors, labelOnTint } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { scrollContentInsetPadding } from "@/lib/scroll-padding";
import { supabase } from "@/lib/supabase";

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

type ExerciseRow = {
  id: string;
  name: string;
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

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = {
    background: theme.background,
    surface: isDark ? "#1C1F23" : "#F8FAFC",
    border: isDark ? "#31363F" : "#E5E7EB",
    text: theme.text,
    muted: theme.icon,
    accent: theme.tint,
    accentText: labelOnTint(isDark),
    rowHighlight: isDark ? "#252A33" : "#EEF2F7",
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<BmiEntry[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, string>>({});

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
      .select("id, started_at, status")
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

          const exerciseIds = Array.from(
            new Set(
              normalizedSets
                .map((row) => row.exercise_id)
                .filter((id): id is string => !!id),
            ),
          );

          if (exerciseIds.length) {
            const { data: exerciseRows, error: exercisesErr } = await supabase
              .from("exercises")
              .select("id, name")
              .in("id", exerciseIds);

            if (exercisesErr) {
              setError((prev) => appendError(prev, exercisesErr.message));
            } else {
              const map: Record<string, string> = {};
              ((exerciseRows ?? []) as ExerciseRow[]).forEach((row) => {
                map[row.id] = row.name;
              });
              setExerciseMap(map);
            }
          } else {
            setExerciseMap({});
          }
        }
      } else {
        setWorkoutSets([]);
        setExerciseMap({});
      }
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

  const trendPoints = useMemo(() => entries.slice(0, 7).reverse(), [entries]);

  const milestones = useMemo(() => {
    const list: { title: string; subtitle: string }[] = [];
    if (!entries.length) return list;

    const oldest = entries[entries.length - 1];
    list.push({
      title: "First BMI check-in",
      subtitle: formatDateLabel(oldest.created_at),
    });

    if (entries.length >= 5) {
      list.push({
        title: "Consistency milestone",
        subtitle: "Completed 5 BMI check-ins",
      });
    }

    if (entries.length >= 10) {
      list.push({
        title: "Progress milestone",
        subtitle: "Completed 10 BMI check-ins",
      });
    }

    if (workoutMetrics.totalWorkouts >= 1) {
      const firstSession = [...sessions]
        .filter((s) => !!s.started_at)
        .sort((a, b) => {
          const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
          const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
          return aTime - bTime;
        })[0];

      if (firstSession?.started_at) {
        list.push({
          title: "First workout completed",
          subtitle: formatDateLabel(firstSession.started_at),
        });
      }
    }

    if (workoutMetrics.totalWorkouts >= 10) {
      list.push({
        title: "Workout milestone",
        subtitle: "Completed 10 workouts",
      });
    }

    return list;
  }, [entries, sessions, workoutMetrics.totalWorkouts]);

  const recentPrs = useMemo(() => {
    const bestByExercise: Record<
      string,
      {
        exerciseId: string;
        name: string;
        weight: number;
        reps: number;
        date: string | null;
      }
    > = {};

    workoutSets.forEach((set) => {
      if (
        !set.exercise_id ||
        set.actual_weight === null ||
        set.actual_reps === null
      )
        return;
      const current = bestByExercise[set.exercise_id];
      const candidate = {
        exerciseId: set.exercise_id,
        name: exerciseMap[set.exercise_id] ?? "Unknown exercise",
        weight: set.actual_weight,
        reps: set.actual_reps,
        date: set.created_at,
      };

      if (!current) {
        bestByExercise[set.exercise_id] = candidate;
        return;
      }

      if (candidate.weight > current.weight) {
        bestByExercise[set.exercise_id] = candidate;
        return;
      }

      if (
        candidate.weight === current.weight &&
        candidate.reps > current.reps
      ) {
        bestByExercise[set.exercise_id] = candidate;
      }
    });

    return Object.values(bestByExercise)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [workoutSets, exerciseMap]);

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
            <Text style={{ color: palette.text, fontWeight: "700" }}>Back</Text>
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
          <KpiCard
            label="Current BMI"
            value={metrics.latestBmi ? metrics.latestBmi.toFixed(1) : "--"}
            subtitle={metrics.currentCategory ?? "No category yet"}
            palette={palette}
          />
          <KpiCard
            label="30-Day Change"
            value={
              metrics.delta30d === null
                ? "--"
                : `${metrics.delta30d > 0 ? "+" : ""}${metrics.delta30d}`
            }
            palette={palette}
          />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard
            label="Workouts This Week"
            value={String(workoutMetrics.workoutsThisWeek)}
            palette={palette}
          />
          <KpiCard
            label="Current Streak"
            value={String(workoutMetrics.currentStreak)}
            palette={palette}
          />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard
            label="Total Workouts"
            value={String(workoutMetrics.totalWorkouts)}
            palette={palette}
          />
          <KpiCard
            label="Total BMI Check-ins"
            value={String(entries.length)}
            palette={palette}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            BMI Trend (latest 7)
          </Text>
          {!trendPoints.length ? (
            <Text style={{ color: palette.muted }}>
              No BMI data yet. Calculate and save BMI to see trends.
            </Text>
          ) : (
            trendPoints.map((point) => (
              <View
                key={point.id}
                style={[styles.row, { borderBottomColor: palette.border }]}
              >
                <Text style={{ color: palette.text, fontWeight: "600" }}>
                  {formatDateLabel(point.created_at)}
                </Text>
                <Text style={{ color: palette.text, fontWeight: "800" }}>
                  {point.bmi.toFixed(1)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Milestones
          </Text>
          {!milestones.length ? (
            <Text style={{ color: palette.muted }}>
              Complete your first BMI check-in to unlock milestones.
            </Text>
          ) : (
            milestones.map((m) => (
              <View
                key={m.title}
                style={[
                  styles.milestone,
                  {
                    backgroundColor: palette.rowHighlight,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={{ color: palette.text, fontWeight: "700" }}>
                  {m.title}
                </Text>
                <Text style={{ color: palette.muted, marginTop: 2 }}>
                  {m.subtitle}
                </Text>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Recent Activity
          </Text>
          {!entries.length ? (
            <Text style={{ color: palette.muted }}>
              No recent activity yet. Save a BMI entry to start tracking your
              progress.
            </Text>
          ) : (
            entries.slice(0, 5).map((entry) => (
              <View
                key={entry.id}
                style={[styles.row, { borderBottomColor: palette.border }]}
              >
                <View>
                  <Text style={{ color: palette.text, fontWeight: "700" }}>
                    BMI {entry.bmi.toFixed(1)}
                  </Text>
                  <Text style={{ color: palette.muted, marginTop: 2 }}>
                    {entry.category ?? getBmiCategory(entry.bmi)}
                  </Text>
                </View>
                <Text style={{ color: palette.muted }}>
                  {formatDateLabel(entry.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Workout Consistency
          </Text>
          {workoutMetrics.totalWorkouts === 0 ? (
            <Text style={{ color: palette.muted }}>
              No workouts logged yet. Start a workout session to build
              consistency insights.
            </Text>
          ) : (
            <>
              <Text style={{ color: palette.text, fontWeight: "700" }}>
                {workoutMetrics.workoutsThisWeek} workout(s) in the last 7 days
              </Text>
              <Text style={{ color: palette.muted, marginTop: 6 }}>
                Current streak: {workoutMetrics.currentStreak} day(s)
              </Text>
              <Text style={{ color: palette.muted, marginTop: 2 }}>
                Total sessions tracked: {workoutMetrics.totalWorkouts}
              </Text>
            </>
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Recent PRs
          </Text>
          {!recentPrs.length ? (
            <Text style={{ color: palette.muted }}>
              No PR data yet. Log workout sets with actual weight and reps to
              surface your top lifts.
            </Text>
          ) : (
            recentPrs.map((pr) => (
              <View
                key={pr.exerciseId}
                style={[styles.row, { borderBottomColor: palette.border }]}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ color: palette.text, fontWeight: "700" }}>
                    {pr.name}
                  </Text>
                  <Text style={{ color: palette.muted, marginTop: 2 }}>
                    {pr.date ? formatDateLabel(pr.date) : "Date unavailable"}
                  </Text>
                </View>
                <Text style={{ color: palette.text, fontWeight: "800" }}>
                  {pr.weight} kg x {pr.reps}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  palette,
}: {
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
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  retryBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
