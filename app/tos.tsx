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
import { SafeAreaView } from "react-native-safe-area-context";
import { TOS_VERSION } from "@/constants/tos";
import { supabase } from "../lib/supabase";

const TOS_TEXT = `
Terms of Service
1) This app is for personal fitness tracking only.
2) It is not medical advice.
3) Use at your own risk. Stop if you feel pain or unwell.
4) Data you save is stored in our database tied to your account.
5) We are not responsible for any health injuries.
`;

function showAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmDeclineWeb(): boolean {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(
      "Decline Terms?\n\nYou must accept the Terms to use the app.\n\nLog out now?",
    );
  }
  return false;
}

function defaultUsername(user: { id: string; email?: string | null }) {
  const fromEmail = user.email?.split("@")[0]?.trim();
  if (fromEmail && fromEmail.length >= 2) return fromEmail.slice(0, 40);
  return `user_${user.id.replace(/-/g, "").slice(0, 12)}`;
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

      const user = userData.user;
      if (!user?.id) throw new Error("No user session found.");

      const acceptance = {
        tos_version: TOS_VERSION,
        tos_accepted_at: new Date().toISOString(),
      };

      const { data: updatedRows, error: updateErr } = await supabase
        .from("profiles")
        .update(acceptance)
        .eq("id", user.id)
        .select("id");

      if (updateErr) throw updateErr;

      if (!updatedRows?.length) {
        const username = defaultUsername(user);
        const { error: insertErr } = await supabase.from("profiles").insert({
          id: user.id,
          username,
          completed_onboarding: false,
          ...acceptance,
        });

        if (insertErr) {
          const { error: retryErr } = await supabase
            .from("profiles")
            .update(acceptance)
            .eq("id", user.id);
          if (retryErr) throw insertErr;
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("completed_onboarding")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.completed_onboarding) {
        router.replace("/(tabs)" as const);
      } else {
        router.replace("/onboarding" as const);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErrorText(msg);
      showAlert("Could not save", msg);
    } finally {
      setSaving(false);
    }
  }

  async function decline() {
    setErrorText(null);

    if (Platform.OS === "web") {
      if (!confirmDeclineWeb()) return;
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in" as const);
      return;
    }

    Alert.alert("Terms required", "You must accept to use the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/sign-in" as const);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Terms of Service</Text>

        <ScrollView
          style={styles.box}
          contentContainerStyle={styles.boxContent}
          keyboardShouldPersistTaps="handled"
        >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0c" },
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0c" },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 12,
  },
  box: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 120,
    backgroundColor: "#141416",
    borderRadius: 14,
  },
  boxContent: { padding: 14, paddingBottom: 20 },
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
