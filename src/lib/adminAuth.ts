import {
  API_BASE_URL,
  apiUrl,
} from './api';

const ADMIN_TOKEN_KEY =
  'function-base-admin-token';

type PatchedWindow = Window & {
  __functionBaseAdminFetchPatched?:
    boolean;
};

export function getAdminToken():
  string | null {
  return sessionStorage.getItem(
    ADMIN_TOKEN_KEY,
  );
}

export function setAdminToken(
  token: string,
) {
  sessionStorage.setItem(
    ADMIN_TOKEN_KEY,
    token,
  );
}

export function clearAdminToken() {
  sessionStorage.removeItem(
    ADMIN_TOKEN_KEY,
  );
}

export async function loginAdmin(
  password: string,
): Promise<void> {
  const response = await fetch(
    apiUrl('/api/admin/login'),
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        password,
      }),
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ??
        '后台密码验证失败',
    );
  }

  if (
    typeof data?.token !== 'string'
  ) {
    throw new Error(
      '服务器没有返回后台凭证',
    );
  }

  setAdminToken(
    data.token,
  );
}

export async function validateAdminSession():
  Promise<boolean> {
  if (!getAdminToken()) {
    return false;
  }

  const response = await fetch(
    apiUrl('/api/admin/session'),
  );

  if (!response.ok) {
    clearAdminToken();
    return false;
  }

  return true;
}

export async function logoutAdmin() {
  try {
    if (getAdminToken()) {
      await fetch(
        apiUrl('/api/admin/logout'),
        {
          method: 'POST',
        },
      );
    }
  } finally {
    clearAdminToken();
  }
}

export function installAdminFetchInterceptor() {
  const patchedWindow =
    window as PatchedWindow;

  if (
    patchedWindow
      .__functionBaseAdminFetchPatched
  ) {
    return;
  }

  patchedWindow
    .__functionBaseAdminFetchPatched =
    true;

  const originalFetch =
    window.fetch.bind(window);

  const normalizedApiBase =
    API_BASE_URL.replace(
      /\/+$/,
      '',
    );

  window.fetch = async (
    input:
      RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const token =
      getAdminToken();

    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const absoluteUrl =
      new URL(
        requestUrl,
        window.location.href,
      ).toString();

    const isApiRequest =
      absoluteUrl.startsWith(
        `${normalizedApiBase}/api/`,
      );

    let nextInit = init;

    if (
      token &&
      isApiRequest
    ) {
      const inputHeaders =
        input instanceof Request
          ? input.headers
          : undefined;

      const headers =
        new Headers(
          init?.headers ??
            inputHeaders,
        );

      if (
        !headers.has(
          'Authorization',
        )
      ) {
        headers.set(
          'Authorization',
          `Bearer ${token}`,
        );
      }

      nextInit = {
        ...init,
        headers,
      };
    }

    const response =
      await originalFetch(
        input,
        nextInit,
      );

    if (
      token &&
      isApiRequest &&
      response.status === 401 &&
      !absoluteUrl.endsWith(
        '/api/admin/login',
      )
    ) {
      clearAdminToken();
    }

    return response;
  };
}
