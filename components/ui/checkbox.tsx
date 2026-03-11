import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";

type CheckboxProps = {
  /** Visible label shown next to the checkbox */
    label?: string;
  /** Whether the checkbox is checked */
    value: boolean;
  /** Called when the checkbox value changes */
    onValueChange: (newValue: boolean) => void;
  /** Disable interaction */
    disabled?: boolean;
  /** Additional style for the outer container */
    style?: ViewStyle;
  /** Additional style for the label text */
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
    const handlePress = () => {
        if (disabled) {
            return;
    }
        onValueChange(!value);
    };

    return (
        <TouchableOpacity
            style={[styles.container, style, disabled && styles.boxDisabled]}
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={disabled}
        >
        <View style={[styles.box, value && styles.boxChecked, disabled && styles.boxDisabled]}>
            {value && <View style={styles.checkmark} />}
        </View>
        {label ? (
        <Text style={[styles.label, labelStyle, disabled && styles.labelDisabled]}>{label}</Text>
        ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8
    },
    box: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#333",
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    boxChecked: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    boxDisabled: {
        borderColor: "#ccc",
        backgroundColor: "#f2f2f2",
    },
    checkmark: {
        width: 12,
        height: 12,
        backgroundColor: "#fff",
        borderRadius: 2,
    },
    label: {
        marginLeft: 10,
        fontSize: 16,
        color: "#000",
    },
    labelDisabled: {
        color: "#999",
    },
});
