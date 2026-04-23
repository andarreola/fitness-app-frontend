import React, {createContext, useState, useContext, ReactNode} from 'react';
import {supabase} from '@/lib/supabase'

interface IntakeData {
    full_name?: string;
    age?: number;
    fitness_goal?: string;
    completed_onboarding?: boolean //might not need this 
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