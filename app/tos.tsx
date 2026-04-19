import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const TOS_VERSION = "2026-03-10";

const TOS_TEXT = `
Terms of Service
1) This app is for personal fitness tracking only.
2) It is not medical advice.
3) Use at your own risk. Stop if you feel pain or unwell.
4) Data you save is stored in our database tied to your account.
5) We are not responsible for any health injuries.
`;

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    return window.confirm(`${title}\n\n${message}`);
  }
  return false;
}

export default function TosScreen() {
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function accept() {
    setErrorText(null);
    setSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const userId = userData.user?.id;
      if (!userId) throw new Error("No user session found.");

      const { error } = await supabase
        .from("profiles")
        .update({
          tos_version: TOS_VERSION,
          tos_accepted_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      router.replace({ pathname: "/(tabs)" } as any);
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      setErrorText(msg);
      showAlert("Could not save", msg);
    } finally {
      setSaving(false);
    }
  }

  async function decline() {
    setErrorText(null);

    if (Platform.OS === "web") {
      const ok = confirmAlert(
        "Decline Terms?",
        "You must accept the Terms to use the app.\n\nLog out now?",
      );
      if (!ok) return;

      await supabase.auth.signOut();
      router.replace({ pathname: "/(auth)/sign-in" } as any);
      return;
    }

    Alert.alert("Terms required", "You must accept to use the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace({ pathname: "/(auth)/sign-in" } as any);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>

      <ScrollView style={styles.box} contentContainerStyle={{ padding: 14 }}>
        <Text style={styles.text}>{TOS_TEXT}</Text>
      </ScrollView>

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.secondary}
          onPress={decline}
          disabled={saving}
        >
          <Text style={styles.secondaryText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primary, saving && { opacity: 0.6 }]}
          onPress={accept}
          disabled={saving}
        >
          <Text style={styles.primaryText}>
            {saving ? "Saving..." : "I Agree"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version: {TOS_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0c" },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 12,
  },
  box: { flex: 1, backgroundColor: "#141416", borderRadius: 14 },
  text: { color: "#e6e6e8", fontSize: 14, lineHeight: 20 },
  row: { flexDirection: "row", gap: 12, marginTop: 14 },
  primary: {
    flex: 1,
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontWeight: "800" },
  secondary: {
    flex: 1,
    backgroundColor: "#1d1d20",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: { color: "white", fontWeight: "800" },
  version: { color: "#9aa0aa", marginTop: 10, fontSize: 12 },
  error: { color: "#ff6b6b", marginTop: 10 },
});
