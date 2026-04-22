import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuthTosAndOnboarding = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace({ pathname: "/(auth)/sign-in" } as any);
        setAuthChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tos_version, tos_accepted_at, completed_onboarding")
        .eq("id", session.user.id)
        .single();

      const accepted =
        profile?.tos_version === "2026-03-10" && !!profile?.tos_accepted_at;

      if (!accepted) {
        router.replace({ pathname: "/tos" } as any);
        setAuthChecked(true);
        return;
      }

      if (!profile?.completed_onboarding) {
        router.replace({ pathname: "/onboarding" } as any);
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
    };

    checkAuthTosAndOnboarding();
  }, [router]);

  if (!authChecked) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors[colorScheme ?? "light"].background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: Colors[colorScheme ?? "light"].card,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bmi"
        options={{
          title: "BMI",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="heart.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
