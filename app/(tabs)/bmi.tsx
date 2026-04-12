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
  useWindowDimensions,
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
}: {
  unit: UnitSystem;
  setUnit: (u: UnitSystem) => void;
}) {
  return (
    <View style={styles.toggleWrap}>
      <TouchableOpacity
        onPress={() => setUnit("imperial")}
        style={[
          styles.toggleBtn,
          unit === "imperial" && styles.toggleBtnActive,
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            unit === "imperial" && styles.toggleTextActive,
          ]}
        >
          Standard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setUnit("metric")}
        style={[styles.toggleBtn, unit === "metric" && styles.toggleBtnActive]}
      >
        <Text
          style={[
            styles.toggleText,
            unit === "metric" && styles.toggleTextActive,
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
  const twoCol = width >= 900;

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
      style={styles.page}
    >
      <View style={[styles.grid, !twoCol && styles.gridStack]}>
        {/* Left card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardHeaderTitle}>BMI CALCULATOR</Text>
          </View>

          <View style={styles.cardBody}>
            <UnitToggle unit={unit} setUnit={setUnit} />

            <View style={[styles.formRow, !twoCol && styles.formRowStack]}>
              {/* Height */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldTitle}>Height</Text>

                {unit === "metric" ? (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="decimal-pad"
                      placeholder="175"
                      style={styles.smallInput}
                    />
                    <Text style={styles.unitLabel}>Centimeters</Text>
                  </View>
                ) : (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={heightFt}
                      onChangeText={setHeightFt}
                      keyboardType="number-pad"
                      placeholder="5"
                      style={[styles.smallInput, { maxWidth: 70 }]}
                    />
                    <Text style={styles.unitLabel}>ft</Text>
                    <TextInput
                      value={heightIn}
                      onChangeText={setHeightIn}
                      keyboardType="number-pad"
                      placeholder="9"
                      style={[styles.smallInput, { maxWidth: 70 }]}
                    />
                    <Text style={styles.unitLabel}>in</Text>
                  </View>
                )}
              </View>

              {/* Weight */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldTitle}>Weight</Text>

                {unit === "metric" ? (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="decimal-pad"
                      placeholder="80"
                      style={styles.smallInput}
                    />
                    <Text style={styles.unitLabel}>Kilograms</Text>
                  </View>
                ) : (
                  <View style={styles.inlineInput}>
                    <TextInput
                      value={weightLb}
                      onChangeText={setWeightLb}
                      keyboardType="decimal-pad"
                      placeholder="176"
                      style={styles.smallInput}
                    />
                    <Text style={styles.unitLabel}>Pounds</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onCalculate}>
                <Text style={styles.primaryBtnText}>Calculate Your BMI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={onReset}>
                <Text style={styles.secondaryBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  (!calculatedBmi || saving) && styles.disabledBtn,
                ]}
                onPress={onSave}
                disabled={!calculatedBmi || saving}
              >
                <Text style={styles.secondaryBtnText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.cardHeaderSmall}>YOUR BMI IS</Text>
            <Text style={styles.cardHeaderBig}>
              {calculatedBmi ? calculatedBmi.toFixed(1) : "--"}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableHeadCell, { flex: 1 }]}>
                BMI Category
              </Text>
              <Text style={[styles.tableHeadCell, { width: 160 }]}>
                BMI Range
              </Text>
            </View>

            {renderRow("under", "Underweight", "Below 18.5", categoryKey)}
            {renderRow("healthy", "Healthy", "18.5 – 24.9", categoryKey)}
            {renderRow("over", "Overweight", "25.0 – 29.9", categoryKey)}
            {renderRow("obese", "Obesity", "30.0 or above", categoryKey)}
          </View>

          {categoryKey ? (
            <Text style={styles.note}>
              Category:{" "}
              <Text style={styles.noteStrong}>
                {bmiCategoryLabel(categoryKey)}
              </Text>
            </Text>
          ) : (
            <Text style={styles.note}>
              Enter values and press “Calculate Your BMI”.
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function renderRow(
  key: "under" | "healthy" | "over" | "obese",
  label: string,
  range: string,
  active: null | "under" | "healthy" | "over" | "obese",
) {
  const isActive = active === key;
  return (
    <View
      key={key}
      style={[styles.tableRow, isActive && styles.tableRowActive]}
    >
      <Text
        style={[
          styles.tableCell,
          { flex: 1 },
          isActive && styles.tableCellActive,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.tableCell,
          { width: 160 },
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
  },
  gridStack: { flexDirection: "column" },

  card: {
    flex: 1,
    maxWidth: 900,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e7e9ef",
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
