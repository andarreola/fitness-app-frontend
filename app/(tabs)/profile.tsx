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
        <ActivityIndicator />
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { borderColor: theme.tint }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>
              {(profile?.username?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {profile?.username ?? "User"}
            </Text>

            <View style={[styles.badge, { backgroundColor: theme.tint }]}>
              <Text style={styles.badgeText}>VIP Member</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Experience */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Experience
      </Text>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.smallLabel, { color: theme.text }]}>
          Experience Level
        </Text>
        <Text style={[styles.bigValue, { color: theme.text }]}>
          {experienceLevel}
        </Text>
        <Text style={[styles.muted, { color: theme.text }]}>
          You are at the beginning of your weight lifting journey
        </Text>
      </View>

      {/* Account Details */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Account Details
      </Text>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Row label="Email" value={email ?? "-"} themeText={theme.text} />
        <Row
          label="Name"
          value={profile?.username ?? "-"}
          themeText={theme.text}
        />
        <Row label="Level" value={experienceLevel} themeText={theme.text} />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Quick Actions
      </Text>

      <View style={styles.actionsGrid}>
        <ActionButton title="Update Experience" onPress={() => {}} theme={theme} />
        <ActionButton title="Get Started" onPress={() => {}} theme={theme} />
        <ActionButton title="Progress" onPress={() => {}} theme={theme} />
        <ActionButton title="Sign Out" onPress={handleSignOut} theme={theme} />
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  themeText,
}: {
  label: string;
  value: string;
  themeText: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: themeText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: themeText }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  theme,
}: {
  title: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.tint }]}
    >
      <Text style={{ color: theme.text, fontWeight: "700" }}>{title}</Text>
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
  badgeText: { color: "white", fontWeight: "800", fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  smallLabel: { fontSize: 13, fontWeight: "600", opacity: 0.8 },
  bigValue: { fontSize: 22, fontWeight: "900", marginTop: 6 },
  muted: { marginTop: 6, opacity: 0.7 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
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
