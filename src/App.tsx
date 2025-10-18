import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Auth } from "./components/auth";
import { Home } from "./components/Home";
import { Profile } from "./components/Profile";
import { Header } from "./components/header";
import { supabase } from "./supabase-client";

function App() {
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BrowserRouter>
      <div style={styles.appContainer}>
        {session ? (
          <>
            <Header session={session} onLogout={handleLogout} />
            <main style={styles.mainContent}>
              <Routes>
                <Route path="/" element={<Home session={session} />} />
                <Route path="/profile" element={<Profile session={session} />} />
              </Routes>
            </main>
          </>
        ) : (
          <div style={styles.authContainer}>
            <Auth />
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#1a1a1a',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '2rem',
  },
  authContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
};

export default App;
