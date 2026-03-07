import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return Alert.alert("Sign in failed", error.message);

    router.replace("/");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Sign in</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <Pressable
        onPress={onSignIn}
        disabled={loading}
        style={{
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          borderWidth: 1,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/sign-up")}>
        <Text style={{ textAlign: "center" }}>No account? Sign up</Text>
      </Pressable>
    </View>
  );
}