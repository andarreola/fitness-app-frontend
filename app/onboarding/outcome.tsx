import { TOS_VERSION } from "@/constants/tos";
import { Colors, labelOnTint } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { scrollContentInsetPadding } from "@/lib/scroll-padding";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Outcome types from ACSM Exercise Preparticipation algorithm (Figure 2 flowchart).
 * 6 possibilities → 3 cleared outcomes (matching flowchart exactly):
 *
 * 1. light-moderate-start: NOT active, no disease, no symptoms
 * 2. moderate-vigorous: Active, no disease, no symptoms
 * 3. moderate-only: Active, has disease, asymptomatic
 */
export type OutcomeType = "light-moderate-start" | "moderate-vigorous" | "moderate-only";

const OUTCOME_CONFIG: Record<
  OutcomeType,
  { title: string; intensity: string; description: string; definitions?: string }
> = {
  "light-moderate-start": {
    title: "Medical clearance not necessary",
    intensity: "Light* to moderate** intensity exercise recommended",
    description:
      "May gradually progress to vigorous*** intensity exercise following ACSM guidelines.",
    definitions:
      "Light*: 30–40% HRR, 2–3 METs, RPE 9–11. Moderate**: 40–60% HRR, 3–6 METs, RPE 12–13. Vigorous***: ≥60% HRR, ≥6 METs, RPE ≥14.",
  },
  "moderate-vigorous": {
    title: "Medical clearance not necessary",
    intensity: "Continue moderate** or vigorous*** intensity exercise",
    description:
      "May gradually progress following ACSM guidelines.",
    definitions:
      "Moderate**: 40–60% HRR, 3–6 METs, RPE 12–13. Vigorous***: ≥60% HRR, ≥6 METs, RPE ≥14.",
  },
  "moderate-only": {
    title: "Medical clearance for moderate exercise not necessary",
    intensity: "Continue with moderate** intensity exercise",
    description:
      "Medical clearance (within the last 12 months if no change in signs/symptoms) recommended before engaging in vigorous*** intensity exercise. Following medical clearance, may gradually progress as tolerated following ACSM guidelines.",
    definitions:
      "Moderate**: 40–60% HRR, 3–6 METs, RPE 12–13. Vigorous***: ≥60% HRR, ≥6 METs, RPE ≥14.",
  },
};

export default function OnboardingOutcomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const { outcome } = useLocalSearchParams<{ outcome: OutcomeType }>();

  const config =
    outcome && OUTCOME_CONFIG[outcome as OutcomeType]
      ? OUTCOME_CONFIG[outcome as OutcomeType]
      : OUTCOME_CONFIG["light-moderate-start"];

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Not signed in.");
        return;
      }

      const { data: profile, error: profileReadErr } = await supabase
        .from("profiles")
        .select("username, tos_version, tos_accepted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileReadErr) throw profileReadErr;

      const metadataUsername =
        typeof user.user_metadata?.username === "string"
          ? user.user_metadata.username.trim()
          : "";
      const resolvedUsername = profile?.username?.trim() || metadataUsername;

      if (!resolvedUsername) {
        throw new Error(
          "Username is missing for this account. Please sign out and create your account again.",
        );
      }

      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username: resolvedUsername,
            completed_onboarding: true,
            tos_version: profile?.tos_version ?? TOS_VERSION,
            tos_accepted_at:
              profile?.tos_accepted_at ?? new Date().toISOString(),
          },
          { onConflict: "id" },
        );

      if (upsertErr) throw upsertErr;

      const { data: check, error: checkErr } = await supabase
        .from("profiles")
        .select("completed_onboarding")
        .eq("id", user.id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (check?.completed_onboarding !== true) {
        throw new Error(
          "Could not save onboarding completion. Check RLS on public.profiles.",
        );
      }

      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.replace("/onboarding");
  };

  const scrollPadding = scrollContentInsetPadding(insets, 6, 28);

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, scrollPadding]}
    >
      <View style={[styles.badge, { backgroundColor: theme.tint }]}>
        <Text style={[styles.badgeText, { color: labelOnTint(isDark) }]}>
          ✓ Cleared
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>

      <View style={[styles.intensityCard, { backgroundColor: theme.card, borderLeftColor: theme.tint }]}>
        <Text style={[styles.intensityLabel, { color: theme.icon }]}>
          Recommended intensity
        </Text>
        <Text style={[styles.intensityValue, { color: theme.tint }]}>
          {config.intensity}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.body, { color: theme.text }]}>
          {config.description}
        </Text>
        {config.definitions && (
          <Text style={[styles.definitions, { color: theme.icon }]}>
            {config.definitions}
          </Text>
        )}
      </View>

      <Pressable
        onPress={handleContinue}
        disabled={loading}
        style={[styles.primaryButton, { backgroundColor: theme.tint, opacity: loading ? 0.6 : 1 }]}
      >
        <Text style={[styles.primaryButtonText, { color: labelOnTint(isDark) }]}>
          {loading ? "Continuing..." : "Continue to Home"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleGoBack}
        disabled={loading}
        style={[styles.secondaryButton, { borderColor: theme.tint }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.tint }]}>
          Back
        </Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
  },
  intensityCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  intensityLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  intensityValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  definitions: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    fontStyle: "italic",
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
