import React from 'react';
import {View, Text, Pressable, Alert} from "react-native";
import {router} from "expo-router";
import {supabase} from "../../lib/supabase";

export default function Onboarding() {
    const finish = async () => {
        
        try {

        
            const {
                data: {user},
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                return Alert.alert("Error", "Not signed in.")
            }

            const { data,error } = await supabase
                .from("profiles")
                .update({"completed_onboarding": true})
                .eq("id", user.id)
                .select()
                .single()
            
            if (error) throw error;

            console.log("Onboarding completed for user:", data);

            router.replace("/"); // go home
    } catch (err: any) {
        console.error("Onboarding finish error:", err);
        Alert.alert("Error", err?.message ?? "An error occurre", err);
    };
};

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "700" }}>Welcome 👋</Text>
            <Text style={{ fontSize: 16 }}>
                This is where you explain your app / ask for preferences / permissions.
            </Text>

        <Pressable
            onPress={finish}
            style={{ padding: 14, borderRadius: 10, borderWidth: 1, alignItems: "center" }}
        >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Finish onboarding</Text>
        </Pressable>
        </View>
    );
}