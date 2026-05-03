import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ProfileRow = {
  id: string;
  username: string;
  experience_level_id: number | null;
  experience_levels: { display_name: string; code: string } | null;
};

function normalizeProfileRow(raw: unknown): ProfileRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id;
  const username = r.username;
  const experience_level_id = r.experience_level_id;
  if (typeof id !== "string" || typeof username !== "string") return null;

  let nested = r.experience_levels;
  if (Array.isArray(nested)) nested = nested[0] ?? null;
  let experience_levels: ProfileRow["experience_levels"] = null;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const display_name = n.display_name;
    const code = n.code;
    if (typeof display_name === "string" && typeof code === "string") {
      experience_levels = { display_name, code };
    }
  }

  const elid = experience_level_id;
  const parsedId =
    typeof elid === "number"
      ? elid
      : elid != null && String(elid).trim() !== ""
        ? Number(elid)
        : null;

  return {
    id,
    username,
    experience_level_id: Number.isFinite(parsedId) ? parsedId : null,
    experience_levels,
  };
}

export default function ProfileScreen() {
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
    cardSoft: theme.ui.elevated,
  };

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const experienceLevelLabel =
    profile?.experience_levels?.display_name?.trim() ??
    (profile?.experience_level_id != null ? "Unknown" : "Not set");

  const loadProfile = useCallback(async () => {
    setLoading(true);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.warn(sessionError);
    }

    const session = sessionData.session;
    if (!session) {
      router.replace("/(auth)/sign-in");
      setLoading(false);
      return;
    }

    setEmail(session.user.email ?? null);

    const { data: prof, error: profError } = await supabase
      .from("profiles")
      .select(
        "id, username, experience_level_id, experience_levels ( display_name, code )",
      )
      .eq("id", session.user.id)
      .maybeSingle();

    if (profError) {
      console.warn(profError);
      setProfile(null);
    } else {
      setProfile(normalizeProfileRow(prof));
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
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
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : undefined
      }
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Profile</Text>
        <Pressable
          style={[styles.settingsIconBtn, { borderColor: palette.border, backgroundColor: palette.cardSoft }]}
          onPress={() => router.push("/settings")}
        >
          <IconSymbol name="gearshape.fill" size={20} color={palette.accent} />
        </Pressable>
      </View>

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

      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Experience level
      </Text>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.smallLabel, { color: palette.muted }]}>
          Current
        </Text>
        <Text style={[styles.bigValue, { color: palette.text }]}>
          {experienceLevelLabel}
        </Text>
        {!profile?.experience_levels?.display_name ? (
          <Text style={[styles.muted, { color: palette.muted }]}>
            Use Update Experience below to set or change your level.
          </Text>
        ) : null}
      </View>

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
          label="Username"
          value={profile?.username ?? "-"}
          themeText={palette.text}
          borderColor={palette.border}
          mutedColor={palette.muted}
        />
        <Row
          label="Level"
          value={experienceLevelLabel}
          themeText={palette.text}
          borderColor={palette.border}
          mutedColor={palette.muted}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        Quick Actions
      </Text>

      <View style={styles.actionsGrid}>
        <ActionButton title="Update Experience" onPress={() => router.push("/experience")} palette={palette} />
        <ActionButton title="Get Started" onPress={() => {}} palette={palette} />
        <ActionButton title="Progress" onPress={() => router.push("/progress")} palette={palette} />
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
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

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
