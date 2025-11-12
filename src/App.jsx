import React from "react";
import { useState } from 'react';
import { useHashRoute } from "./hooks/useHashRoute.js";
import { useLocalState } from "./hooks/useLocalState.js";
import { TopBar } from "./components/TopBar.jsx";
import { SignInPage, ProfilePage, SignOutPage } from "./pages/AuthPages.jsx";
import { CheckApp } from "./pages/CheckApp.jsx";
import { getToken, clearToken } from './lib/api.js';

export default function App() {
  // Initialize user state from token if exists
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { id: payload.id, username: payload.username };
      } catch (err) {
        console.error('Invalid token:', err);
        clearToken();
      }
    }
    return null;
  });
  
  const [history, setHistory] = useLocalState("app_history", []);
  const { route, navigate } = useHashRoute(user ? "app" : "signin");

  function signOut() {
    clearToken();
    setUser(null);
    // Clear history only when user signs out intentionally
    localStorage.removeItem("app_history");
    setHistory([]);
    navigate("signout");
  }

  function handleSignIn(newUser) {
    setUser(newUser);
    // Reset history when signing in as a new user
    setHistory([]); // This will trigger the useEffect in CheckApp to load new history
    navigate("app");
  }

  // Determine what to render based on auth state and route
  let content = null;
  
  if (!user) {
    // Not authenticated - only show signin/signout
    if (route === "signout") {
      content = <SignOutPage onGoSignIn={() => navigate("signin")} />;
    } else {
      content = <SignInPage onSubmit={handleSignIn} />;
    }
  } else {
    // Authenticated - show requested page
    switch (route) {
      case "profile":
        content = (
          <ProfilePage 
            user={{ email: user.username, name: user.username }}
            onUpdate={(u) => {
              alert("Profile update not implemented yet");
              navigate("app");
            }}
          />
        );
        break;
      case "app":
        content = (
          <CheckApp 
            history={history} 
            setHistory={setHistory} 
            user={user} 
          />
        );
        break;
      default:
        // Invalid route, redirect to app
        if (route !== "signin") {
          navigate("app");
        }
        break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        auth={user ? { email: user.username, name: user.username } : null}
        onSignIn={() => navigate("signin")}
        onProfile={() => navigate("profile")}
        onSignOut={signOut}
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        {content}
      </div>
    </div>
  );
}