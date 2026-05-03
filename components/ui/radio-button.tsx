import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RadioOption({
  label,
  selected,
  onPress,
  containerStyle,
  labelStyle,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={[styles.container, selected && styles.selectedContainer, containerStyle]} onPress={onPress}>
      <View style={[styles.outerCircle, selected && styles.outerCircleSelected]}>
        {selected ? <View style={styles.innerCircle} /> : null}
      </View>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: (typeof Colors)["light"]) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.ui.optionUnselected,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 10,
    },
    selectedContainer: {
      backgroundColor: theme.ui.optionSelected,
      borderColor: theme.ui.accent,
    },
    outerCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.ui.textSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    outerCircleSelected: {
      borderColor: theme.ui.accent,
    },
    innerCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.ui.accent,
    },
    label: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.ui.textPrimary,
      flex: 1,
    },
  });