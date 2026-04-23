import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import RadioOption from "../../components/ui/radio-button";
import Checkbox from "@/components/ui/checkbox";
import { isTosAccepted } from "@/constants/tos";
import { Colors, labelOnTint } from "@/constants/theme";
import { scrollContentInsetPadding } from "@/lib/scroll-padding";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const styles = useMemo(
    () => createStyles(theme, isDark),
    [theme, isDark],
  );

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const redirectIfAlreadyDone = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("tos_version, tos_accepted_at, completed_onboarding")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        console.warn("Onboarding guard profile fetch:", profileErr);
        return;
      }

      if (profile?.completed_onboarding === true) {
        if (isTosAccepted(profile)) {
          router.replace("/(tabs)");
        } else {
          router.replace("/tos");
        }
      }
    };

    void redirectIfAlreadyDone();
  }, []);

  const symptomOptions = [
    { key: "chestDisc", label: "Chest discomfort with exertion" },
    { key: "breathless", label: "Unreasonable breathlessness" },
    { key: "dizziness", label: "Dizziness, fainting, blackouts" },
    { key: "ankleSwelling", label: "Ankle swelling" },
    {
      key: "heartRate",
      label:
        "Unpleasant awareness of a forceful, rapid or irregular heart rate",
    },
    {
      key: "burning",
      label:
        "Burning or cramping sensations in lower legs when walking short distance",
    },
    { key: "heartMurmur", label: "Known heart murmur" },
  ];

  const medicalConditionOptions = [
    { key: "heartAttack", label: "A heart attack" },
    {
      key: "surgery",
      label: "Heart surgery, cardiac cathetrization, or coronary angioplasty",
    },
    {
      key: "pacemaker",
      label: "Pacemaker/implantable cardiac defibrillator/rhythm disturbance",
    },
    { key: "heartValve", label: "Heart valve disease" },
    { key: "heartFailure", label: "Heart failure" },
    { key: "transplantation", label: "Heart transplantation" },
    { key: "heartDisease", label: "Congenital heart disease" },
    { key: "diabetes", label: "Diabetes" },
    { key: "renalDisease", label: "Renal disease" },
  ];

  const [symptoms, setSymptoms] = useState<Record<string, boolean>>(() =>
    symptomOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {}),
  );

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [medicalConditions, setMedicalConditions] = useState<
    Record<string, boolean>
  >(() =>
    medicalConditionOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.key]: false }),
      {},
    ),
  );

  const toggleMedicalCondition = (key: string) => {
    setMedicalConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getOutcome = ():
    | "light-moderate-start"
    | "moderate-vigorous"
    | "moderate-only"
    | "blocked" => {
    const hasAnySymptom = Object.values(symptoms).some(Boolean);
    const hasAnyMedicalCondition = Object.values(medicalConditions).some(
      Boolean,
    );
    const isRegularlyActive = selected === "Yes";

    if (hasAnySymptom) return "blocked";

    if (!isRegularlyActive) {
      if (!hasAnyMedicalCondition) return "light-moderate-start";
      return "blocked";
    }

    if (isRegularlyActive) {
      if (!hasAnyMedicalCondition) return "moderate-vigorous";
      return "moderate-only";
    }

    return "blocked";
  };

  const finish = async () => {
    if (selected === null) {
      return Alert.alert(
        "Required",
        "Please answer whether you participate in regular exercise.",
      );
    }
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return Alert.alert("Error", "Not signed in.");
      }

      const outcome = getOutcome();

      if (outcome === "blocked") {
        router.replace("/onboarding/not-cleared");
        return;
      }

      router.replace({
        pathname: "/onboarding/outcome",
        params: { outcome },
      });
    } catch (err: unknown) {
      console.error("Onboarding finish error:", err);
      const message = err instanceof Error ? err.message : "An error occurred";
      Alert.alert("Error", message);
    }
  };

  const scrollPadding = scrollContentInsetPadding(insets, 6, 28);

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, scrollPadding]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={[styles.welcome, { color: theme.text }]}>Welcome</Text>
      <Text style={[styles.intro, { color: theme.text }]}>
        Before we have you begin, we need to ask you a few questions.
      </Text>

      <Text style={styles.header}>
        1. Have you performed planned, structured physical activity for at least
        30 minutes at moderate intensity on at least 3 days per week for at
        least the last 3 months?
      </Text>

      <View style={styles.section}>
        <RadioOption
          label="Yes"
          selected={selected === "Yes"}
          onPress={() => setSelected("Yes")}
        />
        <RadioOption
          label="No"
          selected={selected === "No"}
          onPress={() => setSelected("No")}
        />
      </View>

      <Text style={styles.header}>2. Do you experience any of the following?</Text>

      <View style={styles.section}>
        {symptomOptions.map((option) => (
          <Checkbox
            key={option.key}
            label={option.label}
            value={symptoms[option.key]}
            onValueChange={() => toggleSymptom(option.key)}
          />
        ))}
      </View>

      <Text style={styles.header}>
        3. Have you had or currently have any of the following medical conditions?
      </Text>

      <View style={styles.section}>
        {medicalConditionOptions.map((option) => (
          <Checkbox
            key={option.key}
            label={option.label}
            value={medicalConditions[option.key]}
            onValueChange={() => toggleMedicalCondition(option.key)}
          />
        ))}
      </View>

      <Pressable
        onPress={finish}
        style={[styles.submitBtn, { backgroundColor: theme.tint }]}
      >
        <Text style={[styles.submitLabel, { color: labelOnTint(isDark) }]}>
          Submit
        </Text>
      </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(
  theme: (typeof Colors)["light"],
  isDark: boolean,
) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
    },
    welcome: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 12,
      marginTop: 0,
    },
    intro: {
      fontSize: 17,
      lineHeight: 24,
      marginBottom: 28,
      opacity: 0.95,
    },
    section: {
      marginBottom: 28,
      backgroundColor: isDark ? "#252A33" : theme.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#3D4450" : "#E5E7EB",
    },
    header: {
      fontSize: 17,
      fontWeight: "700",
      lineHeight: 24,
      marginBottom: 12,
      color: theme.text,
    },
    submitBtn: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
    },
    submitLabel: {
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
