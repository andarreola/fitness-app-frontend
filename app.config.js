import "dotenv/config";

console.log("Loaded env SUPABASE_URL:", process.env.SUPABASE_URL ? "YES" : "NO");

export default ({ config }) => ({
  ...config,
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
});