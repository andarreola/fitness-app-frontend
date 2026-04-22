import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = {
    background: theme.background,
    card: isDark ? "#1C1F23" : "#F8FAFC",
    border: isDark ? "#31363F" : "#D9DEE8",
    text: theme.text,
    muted: theme.icon,
    accent: theme.tint,
    accentText: isDark ? "#151718" : "#FFFFFF",
    inputBg: isDark ? "#151718" : "#FFFFFF",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) return Alert.alert("Sign in failed", error.message);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return Alert.alert("Sign in failed", userErr.message);

    const userId = userData.user?.id;
    if (!userId) return Alert.alert("Sign in failed", "No user session found.");

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("tos_version, tos_accepted_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) return Alert.alert("Sign in failed", profileErr.message);

    const accepted =
      profile?.tos_version === "2026-03-10" && !!profile?.tos_accepted_at;

    if (accepted) router.replace("/(tabs)" as any);
    else router.replace("/tos" as any);
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>Sign in</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Enter your credentials to continue.
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.border,
                  backgroundColor: palette.inputBg,
                },
              ]}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor={palette.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.border,
                  backgroundColor: palette.inputBg,
                },
              ]}
            />

            <Pressable
              onPress={onSignIn}
              disabled={loading}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: palette.accent,
                  borderColor: palette.accent,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: palette.accentText }]}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={[styles.linkText, { color: palette.accent }]}>
                No account? Sign up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  primaryBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  linkText: { textAlign: "center", fontWeight: "600" },
});
