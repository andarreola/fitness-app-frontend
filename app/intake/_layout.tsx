import { ProgressBar } from '@/components/ui/progress-bar';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { IntakeProvider } from '../context/intake-context';

export default function IntakeLayout() {
    return (
        <IntakeProvider>
            <Stack
                screenOptions={{
                    header: ({ route }) => {
                        const stepMap: Record<string, number> = { 'question-1': 1, 'question-2': 2 };
                        const currentStep = stepMap[route.name] || 1;

                        return (
                            <View style={{ paddingTop: 60, padding: 25 }}>
                                <ProgressBar step={currentStep} totalSteps={5}></ProgressBar>
                            </View>
                        );
                    },
                }}
            />
        </IntakeProvider>
    );
}