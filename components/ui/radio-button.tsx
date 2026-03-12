import React from "react";
import {View, Text, TouchableOpacity, StyleSheet, Touchable} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RadioOption({label, selected, onPress} : any) {
    const colorScheme = useColorScheme();
    const theme = Colors["light"];
    const styles = createStyles(theme);
    
    return (
        <TouchableOpacity style = {styles.container} onPress = {onPress}>
            <View style = {styles.outerCircle}>
                {selected && <View style = {styles.innerCircle} />}
            </View>
            <Text style = {styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const createStyles = (theme : any) => 
    StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    outerCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.tint,
        alignItems: "center",
        justifyContent: "center",
    },
    innerCircle: {
        width:14,
        height: 14,
        borderRadius: 14,
        backgroundColor: theme.tint,
    },
    label: {
        marginLeft: 10,
        fontSize: 16,
    }

})