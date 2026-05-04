import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isTosAccepted } from "@/constants/tos";
import { supabase } from "@/lib/supabase";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
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

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("tos_version, tos_accepted_at, completed_onboarding")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileErr) {
        console.warn("Profile fetch in tab layout:", profileErr);
      }

      if (!isTosAccepted(profile)) {
        router.replace({ pathname: "/tos" } as const);
        setAuthChecked(true);
        return;
      }

      if (profile?.completed_onboarding !== true) {
        router.replace({ pathname: "/onboarding" } as const);
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
    };

    checkAuthTosAndOnboarding();
  }, [router]);

  const scheme = colorScheme === "dark" ? "dark" : "light";
  const bg = Colors[scheme].ui.screen;

  if (!authChecked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: bg,
          }}
        >
          <ActivityIndicator
            size="large"
            color={Colors[scheme].ui.highlight}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[scheme].ui.highlight,
        tabBarInactiveTintColor: Colors[scheme].ui.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors[scheme].ui.surface,
          borderTopColor: Colors[scheme].ui.border,
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
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="figure.run" color={color} />
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
    </View>
  );
}
