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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WorkoutContextRow = {
  id: string;
  display_name: string | null;
  equipment_access_type: string | null;
};

const EQUIPMENT_OPTIONS = [
  { id: "dumbbell" as const, label: "Dumbbell", icon: "dumbbell.fill" as const },
  { id: "bands" as const, label: "Light Bands", icon: "heart.fill" as const },
];

function normalize(v: string | null | undefined) {
  return String(v ?? "").toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

function pickContext(
  contexts: WorkoutContextRow[],
  location: "gym" | "home",
  equipmentId: "dumbbell" | "bands",
) {
  const byLocation = contexts.filter((ctx) => normalize(ctx.equipment_access_type).includes(location));
  const keyword = equipmentId === "bands" ? "band" : "dumbbell";
  const exact = byLocation.find((ctx) => normalize(ctx.display_name).includes(keyword));
  if (exact) return exact;
  if (byLocation.length > 0) return byLocation[0];
  return contexts.find((ctx) => normalize(ctx.display_name).includes(keyword)) ?? contexts[0] ?? null;
}

export default function WorkoutSetupScreen() {
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
    selected: theme.ui.optionSelected,
  };

  const [loading, setLoading] = useState(true);
  const [contexts, setContexts] = useState<WorkoutContextRow[]>([]);
  const [location, setLocation] = useState<"gym" | "home">("gym");
  const [equipment, setEquipment] = useState<"dumbbell" | "bands">("dumbbell");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_contexts")
        .select("id, display_name, equipment_access_type")
        .order("sort_order", { ascending: true });
      if (error) {
        Alert.alert("Could not load workout contexts", error.message);
      } else {
        setContexts((data ?? []) as WorkoutContextRow[]);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const selectedContext = useMemo(
    () => pickContext(contexts, location, equipment),
    [contexts, location, equipment],
  );

  const handleContinue = () => {
    if (!selectedContext?.id) {
      Alert.alert("No workout available", "No matching workout context was found.");
      return;
    }
    router.push({ pathname: "/workout", params: { contextId: selectedContext.id } });
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
        <Text style={[styles.headerTitle, { color: palette.accent }]}>Equipment Setup</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>Where are you working out?</Text>
      <View style={styles.locationRow}>
        <ChoicePill
          label="Gym"
          iconName="building.2.fill"
          selected={location === "gym"}
          onPress={() => setLocation("gym")}
          palette={palette}
        />
        <ChoicePill
          label="Home"
          iconName="house.and.flag.fill"
          selected={location === "home"}
          onPress={() => setLocation("home")}
          palette={palette}
        />
      </View>

      <View style={styles.iconCircle}>
        <IconSymbol name="dumbbell.fill" size={22} color={palette.accentText} />
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>What equipment do you have access to?</Text>
      <Text style={[styles.subTitle, { color: palette.muted }]}>Choose the option that best matches your setup</Text>

      {EQUIPMENT_OPTIONS.map((option) => (
        <ChoiceCard
          key={option.id}
          label={option.label}
          iconName={option.icon}
          selected={equipment === option.id}
          onPress={() => setEquipment(option.id)}
          palette={palette}
        />
      ))}

      <Pressable style={[styles.cta, { backgroundColor: "#E8F6FF" }]} onPress={handleContinue}>
        <Text style={styles.ctaText}>Continue with this equipment</Text>
      </Pressable>
    </ScrollView>
  );
}

function ChoicePill({
  label,
  iconName,
  selected,
  onPress,
  palette,
}: {
  label: string;
  iconName: "building.2.fill" | "house.and.flag.fill";
  selected: boolean;
  onPress: () => void;
  palette: {
    card: string;
    border: string;
    text: string;
    selected: string;
    accent: string;
  };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.locationPill,
        {
          backgroundColor: selected ? palette.selected : palette.card,
          borderColor: selected ? palette.accent : palette.border,
        },
      ]}
    >
      <IconSymbol name={iconName} size={16} color={palette.text} />
      <Text style={{ color: palette.text, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function ChoiceCard({
  label,
  iconName,
  selected,
  onPress,
  palette,
}: {
  label: string;
  iconName: "dumbbell.fill" | "heart.fill";
  selected: boolean;
  onPress: () => void;
  palette: {
    card: string;
    border: string;
    text: string;
    selected: string;
    accent: string;
    muted: string;
  };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceCard,
        {
          backgroundColor: selected ? palette.selected : palette.card,
          borderColor: selected ? palette.accent : palette.border,
        },
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: palette.card }]}>
        <IconSymbol name={iconName} size={16} color={selected ? palette.accent : palette.muted} />
      </View>
      <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800", flex: 1 }}>{label}</Text>
      {selected ? <IconSymbol name="trophy.fill" size={16} color={palette.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 28, fontWeight: "800", lineHeight: 34, marginTop: 6 },
  subTitle: { fontSize: 14, marginBottom: 4 },
  locationRow: { flexDirection: "row", gap: 8 },
  locationPill: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: "center",
    backgroundColor: "#D9B56A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  choiceCard: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 74,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  choiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  ctaText: { color: "#0A1A34", fontSize: 16, fontWeight: "800" },
});
