import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExperienceLevel = {
  id: number;
  code: string;
  display_name: string;
};

export default function ExperienceScreen() {
  const insets = useSafeAreaInsets();
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
    selected: theme.ui.optionSelected,
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState<ExperienceLevel[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const [levelsRes, profileRes] = await Promise.all([
        supabase
          .from("experience_levels")
          .select("id, code, display_name")
          .order("id", { ascending: true }),
        supabase
          .from("profiles")
          .select("experience_level_id")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (levelsRes.error) {
        Alert.alert("Could not load experience levels", levelsRes.error.message);
      } else {
        setLevels((levelsRes.data ?? []) as ExperienceLevel[]);
      }

      if (!profileRes.error && profileRes.data?.experience_level_id != null) {
        const raw = profileRes.data.experience_level_id;
        const n = typeof raw === "number" ? raw : Number(raw);
        setSelectedId(Number.isFinite(n) ? n : null);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const selectedLabel = useMemo(() => {
    const row = levels.find((level) => level.id === selectedId);
    return row?.display_name ?? "Not selected";
  }, [levels, selectedId]);

  const handleSave = async () => {
    if (!selectedId) {
      Alert.alert("Select a level", "Please choose your current experience level.");
      return;
    }
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          experience_level_id: selectedId,
        })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Update failed", error.message);
        return;
      }
      Alert.alert("Saved", "Your experience level has been updated.");
      router.back();
    } finally {
      setSaving(false);
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
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: palette.border, backgroundColor: palette.card }]}
        >
          <IconSymbol name="chevron.left" size={18} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>Update Experience</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.label, { color: palette.muted }]}>Current selection</Text>
        <Text style={[styles.value, { color: palette.text }]}>{selectedLabel}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.label, { color: palette.text }]}>Choose your level</Text>
        {levels.map((level) => {
          const name = level.display_name ?? level.code ?? "Level";
          const selected = level.id === selectedId;
          return (
            <Pressable
              key={level.id}
              onPress={() => setSelectedId(level.id)}
              style={[
                styles.option,
                {
                  borderColor: selected ? palette.accent : palette.border,
                  backgroundColor: selected ? palette.selected : palette.card,
                },
              ]}
            >
              <Text style={{ color: palette.text, fontWeight: "700" }}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, { backgroundColor: palette.accent, opacity: saving ? 0.7 : 1 }]}
      >
        <Text style={[styles.saveBtnText, { color: palette.accentText }]}>
          {saving ? "Saving..." : "Save Experience"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800" },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  label: { fontSize: 14, fontWeight: "700" },
  value: { fontSize: 22, fontWeight: "800" },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  saveBtn: {
    marginTop: 4,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 16, fontWeight: "800" },
});
