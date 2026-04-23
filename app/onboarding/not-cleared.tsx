import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors, labelOnTint } from "@/constants/theme";
import { scrollContentInsetPadding } from "@/lib/scroll-padding";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function OnboardingNotClearedScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleRetakeQuestionnaire = () => {
    router.replace("/onboarding");
  };

  const scrollPadding = scrollContentInsetPadding(insets, 6, 28);

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, scrollPadding]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Medical Clearance Required
      </Text>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.body, { color: theme.text }]}>
          Based on your responses to the health screening questionnaire, we
          recommend that you consult with a qualified healthcare provider or
          exercise professional before beginning or resuming physical activity.
        </Text>

        <Text style={[styles.body, { color: theme.text, marginTop: 16 }]}>
          This is to ensure your safety and help you get the most out of your
          fitness journey. Once you have received medical clearance, you may
          retake the questionnaire below.
        </Text>

        <Text style={[styles.reference, { color: theme.icon, marginTop: 20 }]}>
          Reference: PAR-Q+ and ACSM Exercise Preparticipation Health Screening
          Guidelines
        </Text>
      </View>

      <Pressable
        onPress={handleRetakeQuestionnaire}
        style={[styles.primaryButton, { backgroundColor: theme.tint }]}
      >
        <Text style={[styles.primaryButtonText, { color: labelOnTint(isDark) }]}>
          Retake Questionnaire
        </Text>
      </Pressable>

      <Pressable
        onPress={handleSignOut}
        style={[styles.button, { borderColor: theme.tint }]}
      >
        <Text style={[styles.buttonText, { color: theme.tint }]}>Sign Out</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
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
  reference: {
    fontSize: 13,
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
  button: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
