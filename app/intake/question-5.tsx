//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import CheckboxOption from '@/components/ui/checkbox';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionFive() {
    const { updateFormData } = useIntake();
    const router = useRouter();

    const handleBack = async () => {
        router.push('/intake/question-4');
    };

    const handleNext = async () => {
        router.push('/intake/question-6');
    };

    const locationOptions = [
        { key: 'home', label: 'At home' },
        { key: 'outdoors', label: 'At a public park/outdoors' },
        { key: 'atWork', label: 'At my work/office' },
        { key: 'gym', label: 'At a gym' },
    ];

    const [location, setLocation] = useState<Record<string, boolean>>(() =>
        locationOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {})
    );

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>
                Where will you be performing your resistance training exercises? (Check all that apply)
            </Text>
            <View>
                {locationOptions.map((option) => (
                    <CheckboxOption
                        key={option.key}
                        label={option.label}
                        value={location[option.key]}
                        onValueChange={(checked) => {
                            setLocation((prev) => ({ ...prev, [option.key]: checked }));
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
