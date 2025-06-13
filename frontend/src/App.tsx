import { useState } from "react";
import { authClient } from "./lib/auth";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function LoginScreen({ onAuth }: { onAuth: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      if (mode === "signin") {
        await authClient.signIn.email({ email, password });
      } else {
        await authClient.signUp.email({ email, password });
      }
      onAuth(email);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Unexpected error");
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: "40px auto", textAlign: "center" }}>
      <h2 className="text-xl font-semibold">
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </h2>
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4"
      />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2"
      />
      {error && (
        <p style={{ color: "red", marginTop: 8 }}>{error}</p>
      )}
      <Button onClick={handleSubmit} className="w-full mt-4">
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </Button>
      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="mt-2 text-blue-600 text-sm"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}

function SignedInScreen({ email }: { email: string }) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const increment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/counter/increment`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setValue(data.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Welcome, {email}</h2>
      <Button onClick={increment} disabled={loading} className="mt-4">
        {loading ? "Loading..." : "Increment Counter"}
      </Button>
      {value !== null && <p style={{ marginTop: 16 }}>Counter value: {value}</p>}
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState<string | null>(null);

  return email ? (
    <SignedInScreen email={email} />
  ) : (
    <LoginScreen onAuth={setEmail} />
  );
}
