import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!username || !email || !password) {
      return Alert.alert(
        "Missing info",
        "Username, email, and password are required.",
      );
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      return Alert.alert("Sign up failed", error.message);
    }

    const user = data.user;
    if (!user) {
      setLoading(false);
      return Alert.alert("Sign up failed", "No user returned.");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: user.id, username });

    setLoading(false);

    if (profileError) {
      return Alert.alert("Profile error", profileError.message);
    }

    router.replace("/tos" as any);
    ``;
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Create account</Text>

      <TextInput
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <TextInput
        placeholder="Password (min 6 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <Pressable
        onPress={onSignUp}
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
          {loading ? "Creating..." : "Sign Up"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/sign-in")}>
        <Text style={{ textAlign: "center" }}>
          Already have an account? Sign in
        </Text>
      </Pressable>
    </View>
  );
}
