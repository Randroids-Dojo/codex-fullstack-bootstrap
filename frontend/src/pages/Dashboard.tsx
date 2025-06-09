import { useEffect, useState } from 'react';
import { fetchMe, fetchCounter, incrementCounter } from '../api';
import { useLogout, useUser } from '../authClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

interface User {
  id: number;
  sub: string;
  email?: string;
  name?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const userCtx = useUser();

  const [user, setUser] = useState<User | null>(() =>
    userCtx ? { id: 0, sub: userCtx.sub, email: userCtx.email, name: userCtx.name } : null
  );
  const [counter, setCounter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userData, counterData] = await Promise.all([fetchMe(), fetchCounter()]);
        setUser(userData);
        setCounter(counterData.value);
      } catch (err: any) {
        setError(err.response?.data?.detail ?? err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleIncrement() {
    try {
      const data = await incrementCounter();
      setCounter(data.value);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) return <p style={styles.container}>Loading…</p>;
  if (error) return <p style={styles.container}>Error: {error}</p>;

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h2>Welcome, {user?.email || user?.name || user?.sub}</h2>
        <p>User ID: {user?.id}</p>
        <p>
          Global counter: <strong>{counter}</strong>
        </p>
        <Button onClick={handleIncrement}>Increment</Button>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    width: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  button: {
    padding: '0.75rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 600,
  },
};
