import { Colors, labelOnTint } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TimeSelection() {
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];
    const isDark = (colorScheme ?? "light") === "dark";
    const [selectedTime, setSelectedTime] = useState(30);
    const [loading, setLoading] = useState(false);

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


    // TODO: Make this actually update database based on the information from the questions. Currently just sends user to the home page
    const handleSubmit = () => {
        router.push('/(tabs)');
        setLoading(true);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.ui.screen }]} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.ui.surface, borderColor: theme.ui.border }]}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>8</Text>
                </View>
                <Text style={[styles.title, { color: theme.ui.textPrimary }]}>How much time each day do you anticipate training?</Text>
                <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>Pick the average amount of time you expect to train per session.</Text>
                <View style={[styles.pickerWrapper, { borderColor: theme.ui.border, backgroundColor: theme.ui.elevated }]}>
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
                <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    style={[styles.primaryButton, { backgroundColor: theme.tint, opacity: loading ? 0.6 : 1 }]}
                >
                    <Text style={[styles.primaryButtonText, { color: labelOnTint(isDark) }]}>
                        {loading ? "Continuing..." : "Continue"}
                    </Text>
                </Pressable>

                <Text style={[styles.selectionText, { color: theme.ui.textSecondary }]}>Selected: {selectedTime} minutes</Text>
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
    pickerWrapper: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    picker: {
        height: 200,
        width: '100%',
    },
    selectionText: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 20,
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
    },
});