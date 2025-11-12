import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "../components/ui/Card.jsx";
import { Label, Input } from "../components/ui/Inputs.jsx";
import { Button } from "../components/ui/Buttons.jsx";
import { Avatar } from "../components/ui/Avatar.jsx";
import { login, register } from "../lib/api.js";

export function SignInPage({ onSubmit }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    // Validate input
    if (!username || !password) {
      setError("Please fill all fields");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      const user = isRegister
        ? await register(username, password)
        : await login(username, password);
      console.log('Auth successful:', user);  // Debug log
      onSubmit(user);
    } catch (err) {
      console.error('Auth error:', err);  // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader title={isRegister ? "Sign up" : "Sign in"} />
        <CardBody className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : (isRegister ? "Sign up" : "Sign in")}
          </Button>
          <div className="text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function ProfilePage({ user, onUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  useEffect(() => { setName(user?.name || ""); setEmail(user?.email || ""); }, [user]);
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader title="Profile" right={<Avatar name={name} />} />
        <CardBody className="space-y-4">
          <div>
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input disabled value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => onUpdate({ name, email })}>Save</Button>
        </CardBody>
      </Card>
    </div>
  );
}

export function SignOutPage({ onGoSignIn }) {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader title="Signed out" />
        <CardBody className="space-y-4">
          <div className="text-slate-700">Bạn đã đăng xuất.</div>
          <Button className="w-full" onClick={onGoSignIn}>Sign in again</Button>
        </CardBody>
      </Card>
    </div>
  );
}
