//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import RadioOption from '@/components/ui/radio-button';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionFour() {
    /**
     * NOTE: that in this scenario
     * a: knows some basics
     * b: is confident in using resistant training machines
     * c: is confident in using basic movements
     * d: is confident in ability to perform challenging exercises
     * REFER TO Virtual Personal Trainer intake form
     */

    const { formData, updateFormData } = useIntake();
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(formData.abilityRating || null);

    const handleBack = async () => {
        router.push('/intake/question-2');
    };

    const handleNext = async () => {
        if (selected) {
            await updateFormData({ abilityRating: selected });
        }
        router.push('/intake/question-5');
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>
                How would you rate your current weight lifting ability?
            </Text>
            <View>
                <RadioOption
                    label="I know some basics, but need more help on doing the lifts correctly"
                    selected={selected === 'a'}
                    onPress={() => setSelected('a')}
                />
                <RadioOption
                    label="I feel confident using the resistance training machines or body weight exercises, but need instruction on using barbells and dumbbells"
                    selected={selected === 'b'}
                    onPress={() => setSelected('b')}
                />
                <RadioOption
                    label="I feel confident doing some basic movements, like squats while holding dumbbells, lunges with no weight or dumbbells, push ups, bench press, but would need additional coaching on the bigger barbell exercises like barbell back squat or barbell deadlift"
                    selected={selected === 'c'}
                    onPress={() => setSelected('c')}
                />
                <RadioOption
                    label="I am confident in my ability to perform technically challenging exercises like barbell back squat, barbell deadlift, and barbell bent over rows safely and with good technique"
                    selected={selected === 'd'}
                    onPress={() => setSelected('d')}
                />
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
