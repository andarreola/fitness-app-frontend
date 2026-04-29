// Question about whether user has received normal face to face coaching.
// If user answers yes, go to the next question. Otherwise go to the fourth question.

import RadioOption from '@/components/ui/radio-button';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionTwo() {
    const { formData, updateFormData } = useIntake();
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(formData.hasCoaching ? 'Yes' : 'No');

    const handleBack = async () => {
        router.push('/intake/question-1');
    };

    const handleNext = async () => {
        if (selected === 'Yes') {
            await updateFormData({ hasCoaching: true });
            router.push('/intake/question-3');
        } else if (selected === 'No') {
            await updateFormData({ hasCoaching: false });
            router.push('/intake/question-4');
        } else {
            alert('Please select an option before proceeding.');
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>
                Have you received normal face-to-face coaching/instruction on lifting weights, such as taken a weight lifting physical education class, hiring a personal trainer, or receiving direct supervised coaching from a high school sports coach?
            </Text>
            <View>
                <RadioOption
                    label="Yes"
                    selected={selected === 'Yes'}
                    onPress={() => setSelected('Yes')}
                />
                <RadioOption
                    label="No"
                    selected={selected === 'No'}
                    onPress={() => setSelected('No')}
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
