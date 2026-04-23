// This page will ask about the equipment that the user has access to

import CheckboxOption from '@/components/ui/checkbox';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionSix() {
    const { updateFormData } = useIntake();
    const router = useRouter();

    const handleBack = async () => {
        router.push('/intake/question-5');
    };

    const handleNext = async () => {
        router.push('/intake/question-7');
    };

    const equipmentOptions = [
        { key: 'resistanceBands', label: 'Normal resistance bands' },
        { key: 'powerBands', label: 'Power bands' },
        { key: 'pullUpBar', label: 'Pull up bar' },
        { key: 'barbell', label: 'Barbells' },
        { key: 'dumbells', label: 'Dumbells' },
        { key: 'squatRack', label: 'A squat rack' },
        { key: 'flatBench', label: 'A flat bench' },
        { key: 'inclineBench', label: 'An incline bench (or bench that can adjust from flat to incline' },
        { key: 'boxes', label: 'Steps or boxes between 6" and 24" in height' },
        { key: 'medicineBall', label: 'Medicine ball' },
    ];

    const [equipment, setEquipment] = useState<Record<string, boolean>>({
        ...equipmentOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {}),
        hasBumperPlates: false,
        adjustableRack: false,
        hasSafetyBars: false,
        fullCage: false,
        openFace: false,
        heavyDumbbells: false,
    });

    const toggleKey = (key: string) => {
        setEquipment(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>
                What equipment do you have access to? (Check all that apply)
            </Text>

            <View style={styles.listContainer}>
                {equipmentOptions.map((option) => (
                    <View key={option.key}>
                        <CheckboxOption
                            label={option.label}
                            value={equipment[option.key]}
                            onValueChange={() => toggleKey(option.key)}
                        />

                        {equipment[option.key] && (
                            <View style={styles.subOptionContainer}>
                                {option.key === 'barbell' && (
                                    <CheckboxOption
                                        label="I have access to bumper plates"
                                        value={equipment.hasBumperPlates}
                                        onValueChange={() => toggleKey('hasBumperPlates')}
                                    />
                                )}

                                {option.key === 'dumbells' && (
                                    <CheckboxOption
                                        label="Heavier than 50 lbs available?"
                                        value={equipment.heavyDumbbells}
                                        onValueChange={() => toggleKey('heavyDumbbells')}
                                    />
                                )}

                                {option.key === 'squatRack' && (
                                    <View>
                                        <CheckboxOption
                                            label="Is it adjustable?"
                                            value={equipment.rackAdjustable}
                                            onValueChange={() => toggleKey('rackAdjustable')}
                                        />
                                        <CheckboxOption
                                            label="Does it have safety bars?"
                                            value={equipment.rackSafetyBars}
                                            onValueChange={() => toggleKey('rackSafetyBars')}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        lineHeight: 24,
    },
    listContainer: {
        marginBottom: 30,
    },
    subOptionContainer: {
        marginLeft: 32,
        paddingLeft: 12,
        marginTop: -5,
        marginBottom: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#0a7ea4',
    },
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