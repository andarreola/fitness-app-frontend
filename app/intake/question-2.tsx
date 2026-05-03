// Question about whether user has received normal face to face coaching.
// If user answers yes, go to the next question. Otherwise go to the fourth question.

import RadioOption from '@/components/ui/radio-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionTwo() {
    const { updateFormData } = useIntake();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

    const [selected, setSelected] = useState<string | null>(null);

    const handleBack = async () => {
        router.push('/intake/question-1');
    };

    const handleNext = async () => {
        if (selected === 'Yes') {
            router.push('/intake/question-3');
        } else if (selected === 'No') {
            router.push('/intake/question-4');
        } else {
            alert('Please select an option before proceeding.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>1</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>
                    Have you ever received formal face-to-face coaching on lifting weights?
                </Text>
                <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>
                    This includes PE classes, personal training, or supervised sports coaching.
                </Text>

                <RadioOption label="Yes" selected={selected === 'Yes'} onPress={() => setSelected('Yes')} />
                <RadioOption label="No" selected={selected === 'No'} onPress={() => setSelected('No')} />
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
    content: { padding: 16, gap: 16 },
    card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
    questionBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D9B56A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionBadgeText: {
        color: '#0A1A34',
        fontWeight: '800',
    },
    title: { fontSize: 21, fontWeight: '800', lineHeight: 28 },
    subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 2 },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
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
