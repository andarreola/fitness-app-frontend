//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import RadioOption from '@/components/ui/radio-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

    useIntake();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

    const [selected, setSelected] = useState<string | null>(null);

    const handleBack = async () => {
        router.push('/intake/question-2');
    };

    const handleNext = async () => {
        router.push('/intake/question-5');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>2</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>
                    How would you rate your current weight lifting ability?
                </Text>
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
