import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

// 1. Define the Types for TypeScript
interface ProgressBarProps {
    step: number;
    totalSteps: number;
}

export const ProgressBar = ({ step, totalSteps }: ProgressBarProps) => {
  // 2. Initialize the animated value
  // We start it at the current step's fraction
    const animatedWidth = useRef(new Animated.Value(step / totalSteps)).current;

    useEffect(() => {
    // 3. This triggers whenever the 'step' prop changes
        Animated.timing(animatedWidth, {
            toValue: step / totalSteps,
            duration: 450, // Smoothness of the slide (in ms)
            useNativeDriver: false, // Width animations don't support native driver
        }).start();
    }, [step, totalSteps]);

  // 4. Convert the 0-1 value into a percentage string for the style
    const width = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

  // 5. CRITICAL: The 'return' keyword fixes your error
    return (
        <View style={styles.container}>
            <Animated.View style={[styles.bar, { width }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 8,
        width: '100%',
        backgroundColor: '#E5E7EB', // Light gray background
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#0a7ea4', // Blue progress color (Tailwind-style blue-500)
        borderRadius: 4,
    },
});