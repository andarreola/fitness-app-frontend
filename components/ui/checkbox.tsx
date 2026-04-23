import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type CheckboxProps = {
    label?: string;
    value: boolean;
    onValueChange: (newValue: boolean) => void;
    disabled?: boolean;
    style?: ViewStyle;
    labelStyle?: TextStyle;
};

export default function Checkbox({
    label,
    value,
    onValueChange,
    disabled,
    style,
    labelStyle,
}: CheckboxProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handlePress = () => {
    if (disabled) {
      return;
    }
    onValueChange(!value);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, disabled && styles.containerDisabled]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[styles.box, disabled && styles.boxDisabled]}>
        {value ? <View style={styles.checkmark} /> : null}
      </View>
      {label ? (
        <Text
          style={[
            styles.label,
            labelStyle,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const createStyles = (theme: (typeof Colors)["light"], isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: 10,
    },
    containerDisabled: {
      opacity: 0.55,
    },
    box: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.tint,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    boxDisabled: {
      borderColor: isDark ? "#4B5563" : "#ccc",
      backgroundColor: isDark ? "#1F2937" : "#f2f2f2",
    },
    checkmark: {
      width: 16,
      height: 16,
      backgroundColor: theme.tint,
      borderRadius: 2,
    },
    label: {
      marginLeft: 10,
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      flex: 1,
    },
    labelDisabled: {
      color: theme.icon,
    },
  });
