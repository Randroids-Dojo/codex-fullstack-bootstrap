import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message ?? 'Unknown error');
    }
  }

  return (
    <main style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? 'Login' : 'Sign up'}</h1>
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p style={styles.error}>{error}</p>}
        <Button className="w-full mt-2" type="submit">
          {mode === 'login' ? 'Login' : 'Sign up'}
        </Button>
        <p style={{ marginTop: '1rem' }}>
          {mode === 'login' ? 'No account?' : 'Have an account?'}{' '}
          <button type="button" style={styles.linkButton} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
      </form>
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
  form: {
    background: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    width: '320px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1rem',
    fontWeight: 500,
    gap: '0.5rem',
  },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 600,
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
  },
  error: {
    color: '#dc2626',
  },
};
