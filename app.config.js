import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log(
  "Loaded env SUPABASE_URL:",
  process.env.SUPABASE_URL ? "YES" : "NO",
);

export default ({ config }) => ({
  ...config,
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
});
