'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '../../lib/supabase/browser';
import styles from './login.module.css';

type LoginStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === '1') {
        setStatus('error');
        setErrorMessage('Ссылка устарела или уже использована. Запросите новую.');
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const supabase = createBrowserClient();
      const redirectOrigin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${redirectOrigin}/auth/callback`,
        },
      });

      if (error) {
        setStatus('error');
        setErrorMessage(
          'Не удалось отправить ссылку для входа. Проверьте адрес электронной почты и попробуйте снова.'
        );
        return;
      }

      setSubmittedEmail(trimmed);
      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMessage(
        'Не удалось отправить ссылку для входа. Проверьте подключение и попробуйте снова.'
      );
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="login-heading">
        <header className={styles.header}>
          <h1 id="login-heading" className="t-title">
            Вход в NorskLive Pro
          </h1>
          <p className={`t-body ${styles.subtitle}`}>
            Введите ваш адрес электронной почты, чтобы получить одноразовую ссылку для входа.
          </p>
        </header>

        {status === 'sent' ? (
          <div className={`t-body ${styles.noticeSuccess}`} role="status">
            Мы отправили ссылку на {submittedEmail}. Откройте письмо на этом устройстве.
          </div>
        ) : null}

        {status === 'error' && errorMessage ? (
          <div className={`t-body ${styles.noticeError}`} role="alert">
            {errorMessage}
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="login-email" className="t-callout">
              Электронная почта
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="navn@eksempel.no"
              className={`t-body ${styles.input}`}
              disabled={status === 'sending'}
            />
          </div>

          <button
            type="submit"
            className={`t-callout ${styles.primaryBtn}`}
            disabled={status === 'sending'}
            aria-busy={status === 'sending'}
          >
            Получить ссылку для входа
          </button>
        </form>
      </section>
    </main>
  );
}
