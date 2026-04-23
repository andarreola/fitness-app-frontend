import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TimeSelection() {
    const [selectedTime, setSelectedTime] = useState(30);

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

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                How much time each day do you anticipate training?
            </Text>

            <View style={styles.pickerWrapper}>
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

            <Text style={styles.selectionText}>
                Selected: {selectedTime} minutes
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    label: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
    pickerWrapper: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    picker: {
        height: 200,
        width: '100%',
    },
    selectionText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#666',
    },
});