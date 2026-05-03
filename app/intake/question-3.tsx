//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import CheckboxOption from '@/components/ui/checkbox';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionThree() {
    useIntake();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

    const handleBack = async () => {
        router.push('/intake/question-2');
    };

    const handleNext = async () => {
        router.push('/intake/question-4');
    };

    const equipmentOptions = [
        { key: 'bodyWeight', label: 'Body weight exercises like push ups and lunges' },
        { key: 'resistantMachines', label: 'Resistance training machines like a leg press machine or a lat pulldown machine' },
        { key: 'dumbellExercises', label: 'Dumbell exercises like squats holding dumbells in my hands and dumbbell shoulder press' },
        { key: 'barbellExercises', label: 'Barbell exercises like barbell back squat and barbell bench press' },
    ];

    const [equipment, setEquipment] = useState<Record<string, boolean>>(() =>
        equipmentOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {})
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>2</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>
                    Which equipment were you previously coached on?
                </Text>
                <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>
                    Select all that apply.
                </Text>

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
                <Pressable style={[styles.backButton, { borderColor: theme.ui.border, backgroundColor: theme.ui.surface }]} onPress={handleBack}>
                    <IconSymbol name="chevron.left" size={16} color={theme.ui.textPrimary} />
                </Pressable>
                <Pressable style={[styles.nextButton, { backgroundColor: theme.ui.highlight }]} onPress={handleNext}>
                    <Text style={[styles.buttonText, { color: '#0A1A34' }]}>Next</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 24 },
    card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
    questionBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D9B56A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionBadgeText: { color: '#0A1A34', fontWeight: '800' },
    title: { fontSize: 21, fontWeight: '800', lineHeight: 28 },
    subtitle: { fontSize: 14, lineHeight: 20 },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '800',
    },
});
