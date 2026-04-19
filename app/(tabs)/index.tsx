import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  // This is for workout context
  const [contexts, setContexts] = useState<any[]>([]);

  const fetchContexts = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_contexts")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setContexts(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/sign-in");
      } else {
        setEmail(data.session.user.email ?? null);
        // This is for workout context
        await fetchContexts();
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchContexts();
          }}
        />
      }
    >
      <View style={{ marginTop: 40 }}>
        <Text style={{ fontSize: 14, color: "gray" }}>Logged in as:</Text>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{email}</Text>
      </View>

      {/* This is for workout context */}
      <View style={{ gap: 15, marginTop: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "800" }}>Start a Workout</Text>
        <Text style={{ fontSize: 16, color: "gray" }}>
          Where are you training today?
        </Text>

        {contexts.length > 0 ? (
          contexts.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/workout",
                  params: { contextId: item.id },
                })
              }
              style={({ pressed }) => ({
                padding: 20,
                borderRadius: 15,
                backgroundColor: pressed ? "#e0e0e0" : "#f5f5f5",
                borderWidth: 1,
                borderColor: "#eee",
              })}
            >
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {item.display_name}
              </Text>
              <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                {item.equipment_access_type?.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text
              style={{ color: "red", textAlign: "center", marginBottom: 10 }}
            >
              No workout contexts found.
            </Text>
            <Button title="Try Again" onPress={fetchContexts} />
          </View>
        )}
      </View>

      <Pressable
        onPress={handleLogout}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#ff4444",
          alignItems: "center",
          marginTop: 30,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#ff4444" }}>
          Log Out
        </Text>
      </Pressable>
    </ScrollView>
  );
}
