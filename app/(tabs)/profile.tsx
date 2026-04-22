import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type ProfileRow = {
  id: string;
  username: string;
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = {
    background: theme.background,
    card: isDark ? "#1C1F23" : "#F8FAFC",
    border: isDark ? "#31363F" : "#E5E7EB",
    text: theme.text,
    muted: theme.icon,
    accent: theme.tint,
    accentText: isDark ? "#151718" : "#FFFFFF",
  };

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const experienceLevel = useMemo(() => {
    return "Novice";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.warn(sessionError);
      }

      const session = sessionData.session;
      if (!session) {
        router.replace("/sign-in");
        return;
      }

      setEmail(session.user.email ?? null);

      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", session.user.id)
        .single();

      if (profError) {
        console.warn(profError);
      } else {
        setProfile(prof);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { borderColor: palette.accent }]}>
            <Text style={{ color: palette.text, fontSize: 20, fontWeight: "700" }}>
              {(profile?.username?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: palette.text }]}>
              {profile?.username ?? "User"}
            </Text>

            <View style={[styles.badge, { backgroundColor: palette.accent }]}>
              <Text style={[styles.badgeText, { color: palette.accentText }]}>VIP Member</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Experience */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Experience
      </Text>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.smallLabel, { color: palette.muted }]}>
          Experience Level
        </Text>
        <Text style={[styles.bigValue, { color: palette.text }]}>
          {experienceLevel}
        </Text>
        <Text style={[styles.muted, { color: palette.muted }]}>
          You are at the beginning of your weight lifting journey
        </Text>
      </View>

      {/* Account Details */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Account Details
      </Text>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Row
          label="Email"
          value={email ?? "-"}
          themeText={palette.text}
          borderColor={palette.border}
          mutedColor={palette.muted}
        />
        <Row
          label="Name"
          value={profile?.username ?? "-"}
          themeText={palette.text}
          borderColor={palette.border}
          mutedColor={palette.muted}
        />
        <Row
          label="Level"
          value={experienceLevel}
          themeText={palette.text}
          borderColor={palette.border}
          mutedColor={palette.muted}
        />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Quick Actions
      </Text>

      <View style={styles.actionsGrid}>
        <ActionButton title="Update Experience" onPress={() => {}} palette={palette} />
        <ActionButton title="Get Started" onPress={() => {}} palette={palette} />
        <ActionButton title="Progress" onPress={() => {}} palette={palette} />
        <ActionButton title="Sign Out" onPress={handleSignOut} palette={palette} />
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  themeText,
  borderColor,
  mutedColor,
}: {
  label: string;
  value: string;
  themeText: string;
  borderColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <Text style={[styles.rowLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: themeText }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  palette,
}: {
  title: string;
  onPress: () => void;
  palette: {
    card: string;
    border: string;
    accent: string;
    text: string;
  };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: palette.card, borderColor: palette.accent }]}
    >
      <Text style={{ color: palette.text, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },

  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 18, fontWeight: "800" },

  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: "800", fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  smallLabel: { fontSize: 13, fontWeight: "600", opacity: 0.8 },
  bigValue: { fontSize: 22, fontWeight: "900", marginTop: 6 },
  muted: { marginTop: 6, opacity: 0.7 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  rowLabel: { fontWeight: "700", opacity: 0.75 },
  rowValue: { fontWeight: "700" },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    width: "48%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
});
