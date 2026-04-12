import React, {useState} from 'react';
import {View, Text, Pressable, Alert, ScrollView, StyleSheet} from "react-native";
import {router} from "expo-router";
import {supabase} from "../../lib/supabase";
import RadioOption from '../../components/ui/radio-button';
import Checkbox from '@/components/ui/checkbox';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function Onboarding() {
    const [selected, setSelected] = useState<string | null>(null);
    const colorScheme = useColorScheme();
    const theme = Colors["light"];
    const styles = createStyles(theme);

    const symptomOptions = [
        { key: "chestDisc", label: "Chest discomfort with exertion" },
        { key: "breathless", label: "Unreasonable breathlessness" },
        {key: "dizziness", label: "Dizziness, fainting, blackouts"},
        {key: "ankleSwelling", label: "Ankle swelling"},
        {key: "heartRate", label: "Unpleasant awareness of a forceful, rapid or irregular heart rate"},
        {key: "burning", label: "Burning or cramping sensations in lower legs when walking short distance"},
        {key: "heartMurmur", label: "Known heart murmur"}
    ];

    const medicalConditionOptions = [
        {key: "heartAttack", label: "A heart attack"},
        {key: "surgery", label: "Heart surgery, cardiac cathetrization, or coronary angioplasty"},
        {key: "pacemaker", label: "Pacemaker/implantable cardiac defibrillator/rhythm disturbance"},
        {key: "heartValve", label: "Heart valve disease"},
        {key: "heartFailure", label: "Heart failure"},
        {key: "transplantation", label: "Heart transplantation"},
        {key: "heartDisease", label: "Congenital heart disease"},
        {key: "diabetes", label: "Diabetes"},
        {key: "renalDisease", label: "Renal disease"}

    ]

    const [symptoms, setSymptoms] = useState<Record<string, boolean>>(() =>
        symptomOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {})
    );

    const toggleSymptom = (key: string) => {
        setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [medicalConditions, setMedicalConditions] = useState<Record<string, boolean>>(() =>
        medicalConditionOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {})
    );

    const toggleMedicalCondition = (key: string) => {
        setMedicalConditions(prev => ({...prev, [key]: !prev[key]}));
    }
    
    /**
     * ACSM Exercise Preparticipation algorithm (Figure 2 flowchart).
     * 6 possibilities → 3 cleared outcomes + 3 blocked:
     *
     * NOT active:
     *   1. No disease, no symptoms → light-moderate-start (may progress to vigorous)
     *   2. Has disease, asymptomatic → BLOCKED (medical clearance recommended)
     *   3. Any symptoms → BLOCKED (medical clearance recommended)
     *
     * Active:
     *   4. No disease, no symptoms → moderate-vigorous
     *   5. Has disease, asymptomatic → moderate-only (vigorous needs clearance)
     *   6. Any symptoms → BLOCKED (discontinue, seek clearance)
     */
    
    const getOutcome = (): "light-moderate-start" | "moderate-vigorous" | "moderate-only" | "blocked" => {
        const hasAnySymptom = Object.values(symptoms).some(Boolean);
        const hasAnyMedicalCondition = Object.values(medicalConditions).some(Boolean);
        const isRegularlyActive = selected === "Yes";

        if (hasAnySymptom) return "blocked";

        if (!isRegularlyActive) {
            if (!hasAnyMedicalCondition) return "light-moderate-start";
            return "blocked";
        }

        if (isRegularlyActive) {
            if (!hasAnyMedicalCondition) return "moderate-vigorous";
            return "moderate-only";
        }

        return "blocked";
    };

    const finish = async () => {
        if (selected === null) {
            return Alert.alert("Required", "Please answer whether you participate in regular exercise.");
        }
        try {        
            const {
                data: {user},
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                return Alert.alert("Error", "Not signed in.")
            }

            const outcome = getOutcome();

            if (outcome === "blocked") {
                router.replace("/onboarding/not-cleared");
                return;
            }

            router.replace({ pathname: "/onboarding/outcome", params: { outcome } });
    } catch (err: any) {
        console.error("Onboarding finish error:", err);
        Alert.alert("Error", err?.message ?? "An error occurred", err);
    };
};
    return (        
            <ScrollView style = {styles.container}>
                <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 22, marginTop: 48}}>Welcome 👋</Text>
                <Text style={{ fontSize: 20, marginBottom: 32 }}>
                    Before we have you begin, we need to ask you a few questions. 
                </Text>

                {/* First Section */}
                <Text style = {styles.header}>
                        1.Have you performed planned, structured physical activity for at least 30 minutes at moderate intensity on at least 3 days per week for at least the last 3 moths?
                </Text>

                <View style = {styles.section}>
                    <RadioOption
                        label = "Yes"
                        selected = {selected === "Yes"}
                        onPress = {() => setSelected("Yes")}
                    />
                    <RadioOption
                        label = "No"
                        selected = {selected === "No"}
                        onPress = {() => setSelected("No")}
                    />
                </View>
                
                {/* Second Section */}
                <Text style = {styles.header}>
                    2. Do you experience any of the following?
                </Text>

                <View style = {styles.section}>
                    {symptomOptions.map(option => (
                    <Checkbox
                        key={option.key}
                        label={option.label}
                        value={symptoms[option.key]}
                        onValueChange={() => toggleSymptom(option.key)}
                    />
                ))}
                </View>
                
                {/* Third Section */}
                <Text style = {styles.header}>
                    3. Have you had or currently have any of the following medical conditions?
                </Text>

                <View style = {styles.section}>
                    {medicalConditionOptions.map(option => (
                    <Checkbox
                        key = {option.key}
                        label = {option.label}
                        value = {medicalConditions[option.key]}
                        onValueChange={() => toggleMedicalCondition(option.key)}
                    />
                    ))}
                </View>
                
            {/* Submit Button */}
            <Pressable
                onPress={finish}
                style={styles.submitBtn}
            >
                <Text style={{ fontSize: 16, fontWeight: "600", color: theme.tint }}>Submit</Text>
            </Pressable>
        </ScrollView>      
    );
}
const createStyles = (theme: any) =>
    StyleSheet.create({
    container: {
        padding: 30
    },
    section: {
        marginBottom: 30,
        backgroundColor: "#f3f3f3",
        padding: 15,
        borderRadius: 10
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 15
    },
    submitBtn: {
        padding: 14, 
        borderRadius: 10, 
        borderWidth: 2, 
        alignItems: "center",
        borderColor: theme.tint
    }
})