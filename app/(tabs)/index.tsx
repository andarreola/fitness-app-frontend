import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/sign-in");
      } else {
        setEmail(session.user.email ?? null);
      }

      setLoading(false);
    };

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/sign-in");
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        Logged in as:
      </Text>

      <Text style={{ fontSize: 18 }}>{email}</Text>

      <Pressable
        onPress={handleLogout}
        style={{
          padding: 14,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Log Out
        </Text>
      </Pressable>
    </View>
  );
}