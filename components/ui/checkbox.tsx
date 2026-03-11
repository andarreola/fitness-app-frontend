import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

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
    const theme = Colors["light"];
    const styles = createStyles(theme);

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
        <View style={[styles.box, disabled && styles.boxDisabled]}>
            {value && <View style={styles.checkmark} />}
        </View>
        {label ? (
        <Text style={[styles.label, labelStyle, disabled && styles.labelDisabled]}>{label}</Text>
        ) : null}
        </TouchableOpacity>
    );
}

const createStyles = (theme: any) => 
    StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10
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
        borderColor: "#ccc",
        backgroundColor: "#f2f2f2",
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
        color: "#000",
    },
    labelDisabled: {
        color: "#999",
    },
});
