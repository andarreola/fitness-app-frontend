import React, {createContext, useState, useContext, ReactNode} from 'react';
import {supabase} from '@/lib/supabase'

interface IntakeData {
    full_name?: string;
    age?: number;
    fitness_goal?: string;
    completed_onboarding?: boolean;
    // Question 1: Body weight
    weight?: number;
    // Question 2: Face-to-face coaching
    hasCoaching?: boolean;
    // Question 3: Equipment from formal instruction
    equipmentBodyWeight?: boolean;
    equipmentResistanceMachines?: boolean;
    equipmentDumbells?: boolean;
    equipmentBarbell?: boolean;
    // Question 4: Weight lifting ability rating
    abilityRating?: string;
    // Question 5: Training locations
    locationHome?: boolean;
    locationOutdoors?: boolean;
    locationWork?: boolean;
    locationGym?: boolean;
    // Question 6: Available equipment
    equipmentResistanceBands?: boolean;
    equipmentPowerBands?: boolean;
    equipmentPullUpBar?: boolean;
    equipmentBarbells?: boolean;
    equipmentDumbells?: boolean;
    equipmentSquatRack?: boolean;
    equipmentFlatBench?: boolean;
    equipmentInclineBench?: boolean;
    equipmentBoxes?: boolean;
    equipmentMedicineBall?: boolean;
    hasBumperPlates?: boolean;
    heavyDumbbells?: boolean;
    rackAdjustable?: boolean;
    rackSafetyBars?: boolean;
    // Question 7: Days per week
    daysPerWeek?: number;
    // Question 8: Time per day
    timePerDay?: number;
}

interface IntakeContextType {
    formData: IntakeData;
    updateFormData: (newData: Partial<IntakeData>) => Promise<void>;
    loading: boolean;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export const IntakeProvider = ({children}: {children:ReactNode}) => {
    const [formData, setFormData] = useState<IntakeData>({});
    const [loading, setLoading] = useState(true);

    const updateFormData = async (newData: Partial<IntakeData>) => {
        setFormData(prev => ({...prev, ...newData}));
        const {data: {user}} = await supabase.auth.getUser();
        if(user) {
            await supabase.from('profiles').upsert({id: user.id, ...newData });
        }
    };

    return (
        <IntakeContext.Provider value = {{formData, updateFormData, loading}}>
            {children}
        </IntakeContext.Provider>
    );
};

export const useIntake = () => {
    const context = useContext(IntakeContext);
    if (!context) throw new Error('useIntake must be used within IntakeProvider');
    return context;
}