//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import RadioOption from '@/components/ui/radio-button';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionSeven() {
    const { formData, updateFormData } = useIntake();
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(
        formData.daysPerWeek ? formData.daysPerWeek.toString() : null
    );

    const handleBack = async () => {
        router.push('/intake/question-6');
    };

    const handleNext = async () => {
        if (selected) {
            const days = selected === '4+' ? 4 : parseInt(selected, 10);
            await updateFormData({ daysPerWeek: days });
        }
        router.push('/intake/question-8');
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>
                How many days per week do you intend to perform resistance training?
            </Text>
            <View>
                <RadioOption
                    label="1"
                    selected={selected === '1'}
                    onPress={() => setSelected('1')}
                />
                <RadioOption
                    label="2"
                    selected={selected === '2'}
                    onPress={() => setSelected('2')}
                />
                <RadioOption
                    label="3"
                    selected={selected === '3'}
                    onPress={() => setSelected('3')}
                />
                <RadioOption
                    label="4+"
                    selected={selected === '4+'}
                    onPress={() => setSelected('4+')}
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
