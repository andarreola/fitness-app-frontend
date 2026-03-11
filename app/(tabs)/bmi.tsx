import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type UnitSystem = "metric" | "imperial";

function toNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

// conversions
function ftInToCm(feet: number, inches: number) {
  return feet * 30.48 + inches * 2.54;
}
function lbToKg(lb: number) {
  return lb * 0.45359237;
}

function calcBmiKgCm(weightKg: number, heightCm: number) {
  const hM = heightCm / 100;
  if (
    !isFinite(weightKg) ||
    !isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  )
    return null;
  return weightKg / (hM * hM);
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BmiScreen() {
  const [unit, setUnit] = useState<UnitSystem>("metric");

  // metric inputs
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // imperial inputs
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  const [saving, setSaving] = useState(false);

  // normalize to cm/kg for calculations + saving
  const height = useMemo(() => {
    if (unit === "metric") return toNumber(heightCm);
    return ftInToCm(toNumber(heightFt), toNumber(heightIn));
  }, [unit, heightCm, heightFt, heightIn]);

  const weight = useMemo(() => {
    if (unit === "metric") return toNumber(weightKg);
    return lbToKg(toNumber(weightLb));
  }, [unit, weightKg, weightLb]);

  const bmi = useMemo(() => {
    if (!Number.isFinite(height) || !Number.isFinite(weight)) return null;
    return calcBmiKgCm(weight, height);
  }, [height, weight]);

  const category = useMemo(() => (bmi ? bmiCategory(bmi) : null), [bmi]);

  async function saveResult() {
    if (!bmi) {
      Alert.alert("Invalid input", "Please enter a valid height and weight.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const userId = userData.user?.id;
      if (!userId) throw new Error("No user session found.");

      const { error } = await supabase.from("bmi_entries").insert({
        user_id: userId,
        height_cm: Number(height.toFixed(1)),
        weight_kg: Number(weight.toFixed(1)),
        bmi: Number(bmi.toFixed(2)),
        category,
      });

      if (error) throw error;

      Alert.alert("Saved", "Your BMI entry was saved.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>BMI Calculator</Text>

      {/* Unit toggle */}
      <View style={styles.row}>
        <Chip
          label="cm / kg"
          active={unit === "metric"}
          onPress={() => setUnit("metric")}
        />
        <Chip
          label="ft / lb"
          active={unit === "imperial"}
          onPress={() => setUnit("imperial")}
        />
      </View>

      <View style={styles.card}>
        {unit === "metric" ? (
          <>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
              placeholderTextColor="#777"
              style={styles.input}
            />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="e.g. 72.5"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Height (feet)</Text>
            <View style={styles.row}>
              <TextInput
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="number-pad"
                placeholder="ft"
                placeholderTextColor="#777"
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="number-pad"
                placeholder="in"
                placeholderTextColor="#777"
                style={[styles.input, styles.inputHalf]}
              />
            </View>

            <Text style={styles.label}>Weight (lb)</Text>
            <TextInput
              value={weightLb}
              onChangeText={setWeightLb}
              keyboardType="decimal-pad"
              placeholder="e.g. 160"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </>
        )}

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Your BMI</Text>
          <Text style={styles.resultValue}>{bmi ? bmi.toFixed(1) : "--"}</Text>
          <Text style={styles.resultCategory}>
            {category ?? "Enter height & weight"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={saveResult}
          disabled={!bmi || saving}
          style={[styles.button, (!bmi || saving) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save result"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0b0c" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginTop: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  row: { flexDirection: "row", gap: 10 },
  card: { backgroundColor: "#141416", borderRadius: 16, padding: 16 },
  label: { color: "#c9c9cf", marginTop: 12, marginBottom: 6, fontSize: 14 },
  input: {
    backgroundColor: "#1d1d20",
    borderRadius: 12,
    padding: 12,
    color: "white",
    fontSize: 16,
    flex: 1,
  },
  inputHalf: { flex: 1 },
  resultBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#1a1a1d",
  },
  resultLabel: { color: "#c9c9cf", fontSize: 14 },
  resultValue: {
    color: "white",
    fontSize: 40,
    fontWeight: "800",
    marginTop: 6,
  },
  resultCategory: { color: "white", fontSize: 16, marginTop: 6 },
  button: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#1d1d20",
    marginBottom: 12,
  },
  chipActive: {
    backgroundColor: "#2b5cff",
  },
  chipText: { color: "#c9c9cf", fontWeight: "700" },
  chipTextActive: { color: "white" },
});
