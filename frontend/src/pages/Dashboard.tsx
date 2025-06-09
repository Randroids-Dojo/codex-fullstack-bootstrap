import { useEffect, useState } from 'react';
import { fetchCounter, incrementCounter } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [counter, setCounter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const counterData = await fetchCounter();
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
