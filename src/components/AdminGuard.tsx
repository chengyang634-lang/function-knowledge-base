import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  getAdminToken,
  validateAdminSession,
} from '../lib/adminAuth';

type AdminGuardProps = {
  children: ReactNode;
};

function AdminGuard({
  children,
}: AdminGuardProps) {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const from =
        `${location.pathname}${location.search}`;

      if (!getAdminToken()) {
        navigate(
          '/admin/login',
          {
            replace: true,
            state: {
              from,
            },
          },
        );

        return;
      }

      const valid =
        await validateAdminSession();

      if (cancelled) {
        return;
      }

      if (!valid) {
        navigate(
          '/admin/login',
          {
            replace: true,
            state: {
              from,
            },
          },
        );

        return;
      }

      setChecking(false);
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [
    location.pathname,
    location.search,
    navigate,
  ]);

  if (checking) {
    return (
      <main className="admin-lock-checking">
        <div>
          正在验证后台权限...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export default AdminGuard;
