// This is the question that relates to what the user's weight is.

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIntake } from '../context/intake-context';

export default function QuestionOne() {
    const { updateFormData } = useIntake();
    const router = useRouter();

    const handleNext = async () => {
        router.push('/intake/question-2');
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={styles.heading}>What is your current body weight?</Text>
            <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="Enter body weight"
            />
            <Pressable style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    textInput: {
        padding: 12,
        marginBottom: 15,
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 15,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    nextButton: {
        padding: 12,
        backgroundColor: '#0a7ea4',
        borderRadius: 15,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
});