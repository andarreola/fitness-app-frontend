import React, { useMemo, useState} from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const canSubmit = useMemo(() => {
        const trimmed = email.trim();
        return trimmed.length > 3 && trimmed.includes("@") && password.length >= 8; // sets requirements for email and password
    }, [email, password]);

    const onSignIn = () => {
        // Front-only this is just for now 
        
        Alert.alert("Signed in pressed", `Email: ${email.trim()}`);
        // TODO: Call API here
    };
    
    
    return (
        <SafeAreaView style = {styles.safe}>
            <KeyboardAvoidingView
                style = {{flex: 1}}
                behavior = {Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle = {styles.container}
                    keyboardShouldPersistTaps = "handled"
                >
                    <View style = {styles.card}>
                        <Text style = {styles.title}> Welcome back </Text>
                        <Text style = {styles.subtitle}> Sign in to continue</Text>

                        <View style = {styles.field}>
                            <Text style = {styles.label}> Email </Text>
                            <TextInput
                                value = {email}
                                onChangeText = {setEmail}
                                placeholder = "Your email"
                                keyboardType = "email-address"
                                autoCorrect = {false}
                                textContentType = "emailAddress"
                                style = {styles.input}
                                returnKeyType = "next"
                            />
                        </View>

                        <View style = {styles.field}>
                            <Text style = {styles.label}> Password </Text>
                            <TextInput
                                value = {password}
                                onChangeText = {setPassword}
                                placeholder = "Your password"
                                secureTextEntry = {!showPassword}
                                autoCorrect = {false}
                                textContentType = "password"
                                style = {styles.input}
                                returnKeyType = "done"
                            />
                        </View>

                        <TouchableOpacity
                            onPress = {onSignIn}
                            disabled = {!canSubmit}
                            style = {[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                        >
                            <Text style = {[styles.primaryBtnText, !canSubmit && styles.primaryBtnDisabledText ]}>Sign In</Text></TouchableOpacity>   
                    </View>

        

                </ScrollView>

            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    // TODO: Implement the styles for the login page here
    safe: {flex: 1, backgroundColor: "#fff"},
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#ebebeb",
        borderRadius: 10,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)"
    },
    title: {
        color: "#333",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 6,
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        color: "#6d6d6d",
        marginBottom: 18,
        fontSize: 14,
    },
    field: {
        marginBottom: 15
    },
    label: {
        color: "#555",
        marginBottom: 6,
        fontSize: 14,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        
    },
    primaryBtn: {
        backgroundColor: "#4e7ce0",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        color: "#fff",
    },
    primaryBtnDisabled: {
        backgroundColor: "#ffffff",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d2d2d2",
    },
    primaryBtnText: {
        color: "#fff",
        
    },
    primaryBtnDisabledText: {
        color: "#b4b4b4",
    },
})