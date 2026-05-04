// This page will ask about the equipment that the user has access to

import CheckboxOption from '@/components/ui/checkbox';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionSix() {
    useIntake();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

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
        rackAdjustable: false,
        rackSafetyBars: false,
        fullCage: false,
        openFace: false,
        heavyDumbbells: false,
    });
    const [location, setLocation] = useState<'gym' | 'home'>('gym');

    const toggleKey = (key: string) => {
        setEquipment(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <Text style={[styles.screenTitle, { color: theme.ui.highlight }]}>Equipment Setup</Text>

            <View style={[styles.sectionCard, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <Text style={[styles.sectionPrompt, { color: theme.ui.textPrimary }]}>Where are you working out?</Text>
                <View style={styles.locationRow}>
                    <Pressable
                        onPress={() => setLocation('gym')}
                        style={[
                            styles.locationOption,
                            { borderColor: theme.ui.border, backgroundColor: theme.ui.optionUnselected },
                            location === 'gym' && { borderColor: theme.ui.accent, backgroundColor: theme.ui.optionSelected },
                        ]}
                    >
                        <Text style={[styles.locationText, { color: theme.ui.textPrimary }]}>Gym</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setLocation('home')}
                        style={[
                            styles.locationOption,
                            { borderColor: theme.ui.border, backgroundColor: theme.ui.optionUnselected },
                            location === 'home' && { borderColor: theme.ui.accent, backgroundColor: theme.ui.optionSelected },
                        ]}
                    >
                        <Text style={[styles.locationText, { color: theme.ui.textPrimary }]}>Home</Text>
                    </Pressable>
                </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <Text style={[styles.sectionPrompt, { color: theme.ui.textPrimary }]}>What equipment do you have access to?</Text>
                <Text style={[styles.sectionHint, { color: theme.ui.textSecondary }]}>Choose the options that match your setup.</Text>
                <View style={styles.listContainer}>
                    {equipmentOptions.map((option) => (
                        <View key={option.key}>
                            <CheckboxOption
                                label={option.label}
                                value={equipment[option.key]}
                                onValueChange={() => toggleKey(option.key)}
                            />

                            {equipment[option.key] && (
                                <View style={[styles.subOptionContainer, { borderLeftColor: theme.ui.accent }]}>
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
            </View>

            <View style={styles.buttonRow}>
                <Pressable style={[styles.backButton, { borderColor: theme.ui.border, backgroundColor: theme.ui.surface }]} onPress={handleBack}>
                    <IconSymbol name="chevron.left" size={16} color={theme.ui.textPrimary} />
                </Pressable>
                <Pressable style={[styles.nextButton, { backgroundColor: '#EEF8FF' }]} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Continue with this equipment</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: { padding: 16, gap: 14, paddingBottom: 28 },
    screenTitle: { fontSize: 28, fontWeight: '800' },
    sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
    sectionPrompt: { fontSize: 22, fontWeight: '800', lineHeight: 30 },
    sectionHint: { fontSize: 14, lineHeight: 20 },
    locationRow: { flexDirection: 'row', gap: 10 },
    locationOption: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    locationText: { fontSize: 16, fontWeight: '700' },
    listContainer: { marginTop: 2 },
    subOptionContainer: {
        marginLeft: 16,
        paddingLeft: 12,
        marginTop: -2,
        marginBottom: 10,
        borderLeftWidth: 2,
    },
    buttonRow: {
        gap: 10,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0A1A34',
    },
});