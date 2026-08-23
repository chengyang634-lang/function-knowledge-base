import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  getAdminToken,
  loginAdmin,
  validateAdminSession,
} from '../lib/adminAuth';

import './admin-login.css';

type LoginLocationState = {
  from?: string;
};

function AdminLoginPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const state =
    location.state as
      | LoginLocationState
      | null;

  const destination =
    state?.from ?? '/admin';

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      if (!getAdminToken()) {
        return;
      }

      const valid =
        await validateAdminSession();

      if (
        !cancelled &&
        valid
      ) {
        navigate(
          destination,
          {
            replace: true,
          },
        );
      }
    }

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [
    destination,
    navigate,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!password) {
      setMessage(
        '请输入后台密码',
      );
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await loginAdmin(
        password,
      );

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '后台密码验证失败',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-lock-icon">
          🔒
        </div>

        <div className="admin-login-heading">
          <span>
            Function Base
          </span>

          <h1>
            管理后台已锁定
          </h1>

          <p>
            请输入后台密码后继续。
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <label>
            后台密码

            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target
                    .value,
                )
              }
              placeholder="输入后台密码"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? '验证中...'
              : '解锁后台'}
          </button>
        </form>

        {message && (
          <p className="admin-login-message">
            {message}
          </p>
        )}

        <Link
          to="/"
          className="admin-login-back"
        >
          ← 返回知识库
        </Link>
      </section>
    </main>
  );
}

export default AdminLoginPage;
