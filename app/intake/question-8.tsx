import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';
import { useRouter } from 'expo-router';

export default function TimeSelection() {
    const { formData, updateFormData } = useIntake();
    const router = useRouter();
    const [selectedTime, setSelectedTime] = useState(formData.timePerDay || 30);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let i = 5; i <= 120; i += 5) {
            options.push({
                label: i >= 60
                    ? `${Math.floor(i / 60)}h ${i % 60}m`
                    : `${i} minutes`,
                value: i,
            });
        }
        return options;
    }, []);

    const handleBack = async () => {
        router.push('/intake/question-7');
    };

    const handleFinish = async () => {
        await updateFormData({ timePerDay: selectedTime });
        // Navigate to the next screen after completing the form
        router.push('/(tabs)'); // take user to home screen
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                How much time each day do you anticipate training?
            </Text>

            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedTime}
                    onValueChange={(itemValue) => setSelectedTime(itemValue)}
                    style={styles.picker}
                >
                    {timeOptions.map((opt) => (
                        <Picker.Item
                            key={opt.value}
                            label={opt.label}
                            value={opt.value}
                        />
                    ))}
                </Picker>
            </View>

            <Text style={styles.selectionText}>
                Selected: {selectedTime} minutes
            </Text>

            <View style={styles.buttonRow}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.buttonText}>Back</Text>
                </Pressable>
                <Pressable style={styles.nextButton} onPress={handleFinish}>
                    <Text style={[styles.buttonText, { color: 'white' }]}>Finish</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1 },
    label: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
    pickerWrapper: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    picker: {
        height: 200,
        width: '100%',
    },
    selectionText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#666',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 40,
        marginTop: 30,
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