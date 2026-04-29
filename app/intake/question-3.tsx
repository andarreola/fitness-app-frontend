//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import CheckboxOption from '@/components/ui/checkbox';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionThree() {
    const { formData, updateFormData } = useIntake();
    const router = useRouter();

    const handleBack = async () => {
        router.push('/intake/question-2');
    };

    const handleNext = async () => {
        await updateFormData({
            equipmentBodyWeight: equipment.bodyWeight,
            equipmentResistanceMachines: equipment.resistantMachines,
            equipmentDumbells: equipment.dumbellExercises,
            equipmentBarbell: equipment.barbellExercises,
        });
        router.push('/intake/question-4');
    };

    const equipmentOptions = [
        { key: 'bodyWeight', label: 'Body weight exercises like push ups and lunges' },
        { key: 'resistantMachines', label: 'Resistance training machines like a leg press machine or a lat pulldown machine' },
        { key: 'dumbellExercises', label: 'Dumbell exercises like squats holding dumbells in my hands and dumbbell shoulder press' },
        { key: 'barbellExercises', label: 'Barbell exercises like barbell back squat and barbell bench press' },
    ];

    const [equipment, setEquipment] = useState<Record<string, boolean>>(() => ({
        bodyWeight: formData.equipmentBodyWeight || false,
        resistantMachines: formData.equipmentResistanceMachines || false,
        dumbellExercises: formData.equipmentDumbells || false,
        barbellExercises: formData.equipmentBarbell || false,
    }));

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>
                In this formal instruction, what type of equipment were you instructed in the use of?
            </Text>
            <View>
                {equipmentOptions.map((option) => (
                    <CheckboxOption
                        key={option.key}
                        label={option.label}
                        value={equipment[option.key]}
                        onValueChange={(checked) => {
                            setEquipment((prev) => ({ ...prev, [option.key]: checked }));
                        }}
                    />
                ))}
            </View>
            <View style={styles.buttonRow}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.buttonText}>Back</Text>
                </Pressable>
                <Pressable style={styles.nextButton} onPress={handleNext}>
                    <Text style={[styles.buttonText, { color: 'white' }]}>Next</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    nextButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
