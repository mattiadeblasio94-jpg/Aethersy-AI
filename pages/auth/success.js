import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { token, user, next = '/dashboard' } = router.query;
    if (token && user) {
      try {
        localStorage.setItem('aiforge_token', token);
        localStorage.setItem('aiforge_user', user);
      } catch {}
    }
    router.replace(next);
  }, [router.isReady, router.query]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
        <div style={{ color: '#a78bfa', fontWeight: 600 }}>Accesso completato...</div>
      </div>
    </div>
  );
}
