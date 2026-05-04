import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { IntakeProvider } from '../context/intake-context';

export default function IntakeLayout() {
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    const theme = Colors[scheme];

    return (
        <IntakeProvider>
            <Stack
                screenOptions={{
                    header: ({ route }) => {
                        const stepMap: Record<string, number> = {
                            'question-1': 1,
                            'question-2': 2,
                            'question-3': 3,
                            'question-4': 4,
                            'question-5': 5,
                            'question-6': 6,
                            'question-7': 7,
                            'question-8': 8,
                        };
                        const currentStep = stepMap[route.name] || 1;

                        return (
                            <View
                                style={{
                                    paddingTop: 56,
                                    paddingHorizontal: 20,
                                    paddingBottom: 16,
                                    backgroundColor: theme.ui.screen,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.ui.border,
                                    gap: 8,
                                }}
                            >
                                <Text style={{ color: theme.ui.highlight, fontSize: 20, fontWeight: '800' }}>
                                    Experience Assessment
                                </Text>
                                <ProgressBar step={currentStep} totalSteps={8} />
                            </View>
                        );
                    },
                }}
            />
        </IntakeProvider>
    );
}