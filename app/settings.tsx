import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileRow = {
  id: string;
  username: string;
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const palette = {
    background: theme.ui.screen,
    card: theme.ui.surface,
    cardSoft: theme.ui.elevated,
    border: theme.ui.border,
    text: theme.ui.textPrimary,
    muted: theme.ui.textSecondary,
    accent: theme.ui.highlight,
    accentText: "#0A1A34",
    secondaryButton: "#E8F6FF",
  };

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        Alert.alert("Session error", error.message);
        setLoading(false);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        Alert.alert("Profile error", profileError.message);
      } else if (profile) {
        setUsername((profile as ProfileRow).username ?? "");
      }

      setLoading(false);
    };

    void load();
  }, []);

  const handleUpdateProfile = async () => {
    const nextEmail = email.trim();
    const nextUsername = username.trim();
    if (!nextEmail || !nextUsername) {
      Alert.alert("Missing fields", "Email and username are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        Alert.alert("Session error", sessionError.message);
        return;
      }
      const user = data.session?.user;
      if (!user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      if (nextEmail !== (user.email ?? "")) {
        const { error: emailErr } = await supabase.auth.updateUser({
          email: nextEmail,
        });
        if (emailErr) {
          Alert.alert("Could not update email", emailErr.message);
          return;
        }
      }

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ username: nextUsername })
        .eq("id", user.id);

      if (profileErr) {
        Alert.alert("Could not update profile", profileErr.message);
        return;
      }

      Alert.alert(
        "Profile updated",
        "Your account information was updated. If you changed your email, check your inbox to confirm it.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirm password must match.");
      return;
    }

    setSavingPassword(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        Alert.alert("Session error", sessionError.message);
        return;
      }
      const sessionEmail = data.session?.user.email;
      if (!sessionEmail) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const verify = await supabase.auth.signInWithPassword({
        email: sessionEmail,
        password: currentPassword,
      });
      if (verify.error) {
        Alert.alert("Current password incorrect", verify.error.message);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert("Could not update password", error.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password has been changed.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { borderColor: palette.border, backgroundColor: palette.cardSoft }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={18} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.accent }]}>Settings</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>Account Information</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Field
          iconName="person.crop.circle"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          palette={palette}
        />
        <Field
          iconName="envelope.fill"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          palette={palette}
        />
        <Pressable
          onPress={handleUpdateProfile}
          disabled={savingProfile}
          style={[styles.primaryCta, { backgroundColor: palette.accent, opacity: savingProfile ? 0.7 : 1 }]}
        >
          <Text style={[styles.primaryCtaText, { color: palette.accentText }]}>
            {savingProfile ? "Updating..." : "Update Profile"}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>Change Password</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Field
          iconName="lock.fill"
          placeholder="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          palette={palette}
        />
        <Field
          iconName="key.fill"
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          palette={palette}
        />
        <Field
          iconName="key.fill"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          palette={palette}
        />
        <Pressable
          onPress={handleUpdatePassword}
          disabled={savingPassword}
          style={[styles.secondaryCta, { backgroundColor: palette.secondaryButton, opacity: savingPassword ? 0.7 : 1 }]}
        >
          <Text style={styles.secondaryCtaText}>
            {savingPassword ? "Updating..." : "Update Password"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  iconName,
  palette,
  ...inputProps
}: {
  iconName: "person.crop.circle" | "envelope.fill" | "lock.fill" | "key.fill";
  palette: {
    cardSoft: string;
    border: string;
    text: string;
    muted: string;
  };
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
      <IconSymbol name={iconName} size={18} color={palette.muted} />
      <TextInput
        {...inputProps}
        style={[styles.input, { color: palette.text }]}
        placeholderTextColor={palette.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 28, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginTop: 8, marginBottom: 6 },
  card: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 10 },
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  primaryCta: {
    marginTop: 2,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaText: { fontSize: 18, fontWeight: "800" },
  secondaryCta: {
    marginTop: 2,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCtaText: { fontSize: 18, fontWeight: "800", color: "#0A1A34" },
});
