// This is the question that relates to what the user's weight is.

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionOne() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];
    const { formData, updateFormData } = useIntake();
    const [weight, setWeight] = useState(formData.weight?.toString() || '');

    // TODO: add state
    const handleNext = async () => {
        if (!weight.trim()) {
            alert('Please enter your current body weight before continuing.');
            return;
        }
        // if (!isNaN(weightNum)) {
        //     await updateFormData({ weight: weightNum });
        // }

        router.push('/intake/question-2');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>1</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>What is your current body weight?</Text>
                <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>Enter your weight using your preferred measurement unit.</Text>
                <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    style={[styles.textInput, { backgroundColor: theme.ui.elevated, color: theme.ui.textPrimary, borderColor: theme.ui.border }]}
                    keyboardType="number-pad"
                    placeholder="e.g. 145"
                    placeholderTextColor={theme.ui.textSecondary}
                />
            </View>
            <View style={styles.buttonRow}>
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
    textInput: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 15,
        fontSize: 16,
    },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end' },
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