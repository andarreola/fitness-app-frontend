import React from "react";
import {View, Text, TouchableOpacity, StyleSheet, Touchable} from "react-native";

export default function RadioOption({label, selected, onPress}) {
    return (
        <TouchableOpacity style = {styles.container} onPress = {onPress}>
            <View style = {styles.outerCircle}>
                {selected && <View style = {styles.innerCircle} />}
            </View>
            <Text style = {styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
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
        borderColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
    },
    innerCircle: {
        width:14,
        height: 14,
        borderRadius: 14,
        backgroundColor: "#000000",
    },
    label: {
        marginLeft: 10,
        fontSize: 16,
    }

})