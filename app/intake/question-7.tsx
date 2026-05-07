//Note that this screen is only used when formal face-to-face coaching/instruction IS received by the user

import { IconSymbol } from '@/components/ui/icon-symbol';
import RadioOption from '@/components/ui/radio-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionSeven() {
    useIntake();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

    const [selected, setSelected] = useState<string | null>(null);

    const handleBack = async () => {
        router.push('/intake/question-6');
    };

    const handleNext = async () => {
        router.push('/intake/question-8');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}> 
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>7</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>How many days per week do you intend to perform resistance training?</Text>
                <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>Choose the closest number of training days.</Text>
                <View style={styles.optionGroup}>
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
    subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    optionGroup: { gap: 12 },
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
