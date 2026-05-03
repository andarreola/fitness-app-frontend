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

export default function SignUp() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const palette = {
    background: theme.ui.screen,
    card: theme.ui.surface,
    border: theme.ui.border,
    text: theme.ui.textPrimary,
    muted: theme.ui.textSecondary,
    accent: theme.ui.highlight,
    accentText: "#0A1A34",
    inputBg: theme.ui.elevated,
  };

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
      return Alert.alert(
        "Missing info",
        "Username, email, and password are required.",
      );
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if (error) {
      setLoading(false);
      return Alert.alert("Sign up failed", error.message);
    }

    const user = data.user;
    if (!user) {
      setLoading(false);
      return Alert.alert("Sign up failed", "No user returned.");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: normalizedUsername,
        completed_onboarding: false,
      });

    setLoading(false);

    if (profileError) {
      return Alert.alert("Profile error", profileError.message);
    }

    router.replace({ pathname: "/tos" } as any);
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: palette.background }]} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Set up your account to start tracking workouts.
            </Text>

            <TextInput
              placeholder="Username"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
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
              placeholder="Password (min 6 chars)"
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
              onPress={onSignUp}
              disabled={loading}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: palette.accent,
                  borderColor: palette.border,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: palette.accentText }]}>
                {loading ? "Creating..." : "Sign Up"}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/(auth)/sign-in")} style={[styles.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <Text style={[styles.linkText, { color: palette.accent }]}>
                Already have an account? Sign in
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
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
});
