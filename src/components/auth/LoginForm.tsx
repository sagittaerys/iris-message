import { useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginFormProps {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(username.trim(), password);
    if (!result.ok) {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        label="Username"
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        prefixIcon={<User className="w-4 h-4" />}
        autoComplete="username"
        autoFocus
        disabled={loading}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        prefixIcon={<Lock className="w-4 h-4" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-[#6b6785] hover:text-[#a8a4c8] transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        autoComplete="current-password"
        disabled={loading}
        error={error ?? undefined}
      />

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        loading={loading}
        className="mt-1 w-full"
      >
        {loading ? "Unlocking vault..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[#6b6785]">
        No account?
        <button
          type="button"
          onClick={onSwitch}
          className="text-[#9d8dfa] hover:text-[#7c5ef6] font-medium transition-colors cursor-pointer"
        >
          Create one
        </button>
      </p>
    </form>
  );
}
