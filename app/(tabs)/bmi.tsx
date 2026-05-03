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
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Colors, labelOnTint } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// BMI
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
function bmiCategoryKey(bmi: number) {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "over";
  return "obese";
}
function bmiCategoryLabel(key: ReturnType<typeof bmiCategoryKey>) {
  switch (key) {
    case "under":
      return "Underweight";
    case "healthy":
      return "Healthy";
    case "over":
      return "Overweight";
    case "obese":
      return "Obesity";
  }
}

function UnitToggle({
  unit,
  setUnit,
  colors,
}: {
  unit: UnitSystem;
  setUnit: (u: UnitSystem) => void;
  colors: {
    surface: string;
    border: string;
    text: string;
    accent: string;
    accentText: string;
  };
}) {
  return (
    <View
      style={[styles.toggleWrap, { backgroundColor: colors.surface, borderColor: colors.accent }]}
    >
      <TouchableOpacity
        onPress={() => setUnit("imperial")}
        style={[
          styles.toggleBtn,
          { backgroundColor: colors.surface },
          unit === "imperial" && styles.toggleBtnActive,
          unit === "imperial" && { backgroundColor: colors.accent },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            { color: colors.accent },
            unit === "imperial" && styles.toggleTextActive,
            unit === "imperial" && { color: colors.accentText },
          ]}
        >
          Standard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setUnit("metric")}
        style={[
          styles.toggleBtn,
          { backgroundColor: colors.surface },
          unit === "metric" && styles.toggleBtnActive,
          unit === "metric" && { backgroundColor: colors.accent },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            { color: colors.accent },
            unit === "metric" && styles.toggleTextActive,
            unit === "metric" && { color: colors.accentText },
          ]}
        >
          Metric
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BmiScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const twoCol = width >= 900;
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[scheme];
  const isDark = scheme === "dark";
  const colors = {
    page: theme.ui.screen,
    surface: theme.ui.surface,
    border: theme.ui.border,
    text: theme.ui.textPrimary,
    muted: theme.ui.textSecondary,
    accent: theme.ui.highlight,
    accentText: labelOnTint(isDark),
    tableHead: theme.ui.elevated,
    tableRowBorder: theme.ui.border,
    tableActive: theme.ui.optionSelected,
    inputBg: theme.ui.elevated,
  };

  const [unit, setUnit] = useState<UnitSystem>("metric");

  // inputs
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("80");

  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [weightLb, setWeightLb] = useState("176");

  const heightCmVal = useMemo(() => {
    if (unit === "metric") return toNumber(heightCm);
    return ftInToCm(toNumber(heightFt), toNumber(heightIn));
  }, [unit, heightCm, heightFt, heightIn]);

  const weightKgVal = useMemo(() => {
    if (unit === "metric") return toNumber(weightKg);
    return lbToKg(toNumber(weightLb));
  }, [unit, weightKg, weightLb]);

  const [calculatedBmi, setCalculatedBmi] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryKey = useMemo(() => {
    if (!calculatedBmi) return null;
    return bmiCategoryKey(calculatedBmi);
  }, [calculatedBmi]);

  function onCalculate() {
    const bmi = calcBmiKgCm(weightKgVal, heightCmVal);
    if (!bmi) {
      Alert.alert("Missing info", "Please enter valid height and weight.");
      return;
    }
    setCalculatedBmi(bmi);
  }

  function onReset() {
    setCalculatedBmi(null);

    // Reset to valid defaults so Calculate works immediately.
    if (unit === "metric") {
      setHeightCm("175");
      setWeightKg("80");
    } else {
      setHeightFt("5");
      setHeightIn("9");
      setWeightLb("176");
    }
  }

  async function onSave() {
    if (!calculatedBmi) {
      Alert.alert("Nothing to save", "Calculate your BMI first.");
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
        height_cm: Number(heightCmVal.toFixed(1)),
        weight_kg: Number(weightKgVal.toFixed(1)),
        bmi: Number(calculatedBmi.toFixed(2)),
        category: categoryKey ? bmiCategoryLabel(categoryKey) : null,
        // optional: unit_system: unit,
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
      style={[styles.page, { backgroundColor: colors.page, paddingTop: insets.top + 8 }]}
    >
      <ScrollView
        contentContainerStyle={[styles.grid, !twoCol && styles.gridStack]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : undefined
        }
      >
        {/* Left card */}
        <View
          style={[
            styles.card,
            twoCol && styles.cardTwoCol,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardHeaderTitle}>BMI CALCULATOR</Text>
          </View>

          <View style={styles.cardBody}>
            <UnitToggle unit={unit} setUnit={setUnit} colors={colors} />

            <View style={[styles.formRow, !twoCol && styles.formRowStack]}>
              {/* Height */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldTitle, { color: colors.text }]}>Height</Text>

                {unit === "metric" ? (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="decimal-pad"
                      placeholder="175"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.smallInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.unitLabel, { color: colors.text }]}>Centimeters</Text>
                  </View>
                ) : (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={heightFt}
                      onChangeText={setHeightFt}
                      keyboardType="number-pad"
                      placeholder="5"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.smallInput,
                        {
                          maxWidth: 70,
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.unitLabel, { color: colors.text }]}>ft</Text>
                    <TextInput
                      value={heightIn}
                      onChangeText={setHeightIn}
                      keyboardType="number-pad"
                      placeholder="9"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.smallInput,
                        {
                          maxWidth: 70,
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.unitLabel, { color: colors.text }]}>in</Text>
                  </View>
                )}
              </View>

              {/* Weight */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldTitle, { color: colors.text }]}>Weight</Text>

                {unit === "metric" ? (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="decimal-pad"
                      placeholder="80"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.smallInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.unitLabel, { color: colors.text }]}>Kilograms</Text>
                  </View>
                ) : (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={weightLb}
                      onChangeText={setWeightLb}
                      keyboardType="decimal-pad"
                      placeholder="176"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.smallInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.unitLabel, { color: colors.text }]}>Pounds</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.accent, borderColor: colors.page }]}
                onPress={onCalculate}
              >
                <Text style={[styles.primaryBtnText, { color: colors.accentText }]}>
                  Calculate Your BMI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: colors.surface, borderColor: colors.accent },
                ]}
                onPress={onReset}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: colors.surface, borderColor: colors.accent },
                  (!calculatedBmi || saving) && styles.disabledBtn,
                ]}
                onPress={onSave}
                disabled={!calculatedBmi || saving}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right card */}
        <View
          style={[
            styles.card,
            twoCol && styles.cardTwoCol,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeaderRight}>
            <Text style={styles.cardHeaderSmall}>YOUR BMI IS</Text>
            <Text style={styles.cardHeaderBig}>
              {calculatedBmi ? calculatedBmi.toFixed(1) : "--"}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeadRow, { backgroundColor: colors.tableHead }]}>
              <Text style={[styles.tableHeadCell, { flex: 1, color: colors.text }]}>
                BMI Category
              </Text>
              <Text style={[styles.tableHeadCell, { width: 160, color: colors.text }]}>
                BMI Range
              </Text>
            </View>

            {renderRow("under", "Underweight", "Below 18.5", categoryKey, colors)}
            {renderRow("healthy", "Healthy", "18.5 – 24.9", categoryKey, colors)}
            {renderRow("over", "Overweight", "25.0 – 29.9", categoryKey, colors)}
            {renderRow("obese", "Obesity", "30.0 or above", categoryKey, colors)}
          </View>

          {categoryKey ? (
            <Text style={[styles.note, { color: colors.text }]}>
              Category:{" "}
              <Text style={styles.noteStrong}>
                {bmiCategoryLabel(categoryKey)}
              </Text>
            </Text>
          ) : (
            <Text style={[styles.note, { color: colors.text }]}>
              Enter values and press “Calculate Your BMI”.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function renderRow(
  key: "under" | "healthy" | "over" | "obese",
  label: string,
  range: string,
  active: null | "under" | "healthy" | "over" | "obese",
  colors: {
    text: string;
    tableActive: string;
    tableRowBorder: string;
  },
) {
  const isActive = active === key;
  return (
    <View
      key={key}
      style={[
        styles.tableRow,
        { borderTopColor: colors.tableRowBorder },
        isActive && styles.tableRowActive,
        isActive && { backgroundColor: colors.tableActive },
      ]}
    >
      <Text
        style={[
          styles.tableCell,
          { flex: 1, color: colors.text },
          isActive && styles.tableCellActive,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.tableCell,
          { width: 160, color: colors.text },
          isActive && styles.tableCellActive,
        ]}
      >
        {range}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6fb", padding: 16 },
  grid: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingBottom: 24,
  },
  gridStack: { flexDirection: "column" },

  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e7e9ef",
  },
  cardTwoCol: {
    flex: 1,
    maxWidth: 900,
  },

  cardHeaderLeft: {
    height: 90,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: "#0a6c76",
  },
  cardHeaderTitle: { color: "white", fontSize: 28, fontWeight: "800" },

  cardHeaderRight: {
    height: 90,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b2b6e",
  },
  cardHeaderSmall: {
    color: "white",
    opacity: 0.9,
    fontSize: 14,
    fontWeight: "800",
  },
  cardHeaderBig: {
    color: "white",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 4,
  },

  cardBody: { padding: 24 },

  toggleWrap: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#0a6c76",
    borderRadius: 8,
    overflow: "hidden",
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "white",
  },
  toggleBtnActive: { backgroundColor: "#0a6c76" },
  toggleText: { fontWeight: "800", color: "#0a6c76" },
  toggleTextActive: { color: "white" },

  formRow: { flexDirection: "row", gap: 24, marginTop: 24 },
  formRowStack: { flexDirection: "column" },

  fieldBlock: { flex: 1 },
  fieldTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  inlineInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  smallInput: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: "#d9dde6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    color: "#101828",
    backgroundColor: "white",
  },
  unitLabel: { fontSize: 18, color: "#1a1a1a" },

  btnRow: { flexDirection: "row", gap: 16, marginTop: 30, flexWrap: "wrap" },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#0a6c76",
    borderWidth: 4,
    borderColor: "#2b7cff",
  },
  primaryBtnText: { color: "white", fontWeight: "900", fontSize: 18 },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#0a6c76",
  },
  secondaryBtnText: { color: "#0a6c76", fontWeight: "900", fontSize: 18 },
  disabledBtn: { opacity: 0.5 },

  table: { padding: 0 },
  tableHeadRow: { backgroundColor: "#f6f7fb" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#eef0f5",
  },
  tableRowActive: { backgroundColor: "#e7f3f7" },
  tableHeadCell: { fontWeight: "900", fontSize: 16, color: "#1a1a1a" },
  tableCell: { fontSize: 18, color: "#1a1a1a", fontWeight: "700" },
  tableCellActive: { fontWeight: "900" },

  note: { padding: 18, paddingHorizontal: 24, color: "#333" },
  noteStrong: { fontWeight: "900" },
});
