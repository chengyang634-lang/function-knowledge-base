import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import type {
  NextFunction,
  Request,
  Response,
} from 'express';

const SESSION_TTL_MS =
  12 * 60 * 60 * 1000;

const LOGIN_WINDOW_MS =
  15 * 60 * 1000;

const MAX_LOGIN_ATTEMPTS = 5;

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const sessions =
  new Map<string, number>();

const loginAttempts =
  new Map<string, LoginAttempt>();

function hashText(
  value: string,
): Buffer {
  return createHash('sha256')
    .update(value)
    .digest();
}

function safeEqualText(
  left: string,
  right: string,
): boolean {
  return timingSafeEqual(
    hashText(left),
    hashText(right),
  );
}

function getClientKey(
  request: Request,
): string {
  return (
    request.ip ||
    request.socket.remoteAddress ||
    'unknown'
  );
}

function readBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.header(
      'authorization',
    );

  if (!authorization) {
    return null;
  }

  const [scheme, token] =
    authorization.split(' ');

  if (
    scheme?.toLowerCase() !==
      'bearer' ||
    !token
  ) {
    return null;
  }

  return token;
}

function removeExpiredSessions() {
  const now = Date.now();

  sessions.forEach(
    (expiresAt, token) => {
      if (expiresAt <= now) {
        sessions.delete(token);
      }
    },
  );
}

function getSessionExpiry(
  request: Request,
): number | null {
  removeExpiredSessions();

  const token =
    readBearerToken(request);

  if (!token) {
    return null;
  }

  const expiresAt =
    sessions.get(token);

  if (
    expiresAt == null ||
    expiresAt <= Date.now()
  ) {
    sessions.delete(token);
    return null;
  }

  return expiresAt;
}

export function adminLogin(
  request: Request,
  response: Response,
) {
  const configuredPassword =
    process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return response
      .status(503)
      .json({
        message:
          '服务器尚未配置 ADMIN_PASSWORD',
      });
  }

  const password =
    typeof request.body?.password ===
    'string'
      ? request.body.password
      : '';

  const clientKey =
    getClientKey(request);

  const now = Date.now();

  const previousAttempt =
    loginAttempts.get(
      clientKey,
    );

  const attempt =
    previousAttempt &&
    previousAttempt.resetAt > now
      ? previousAttempt
      : {
          count: 0,
          resetAt:
            now +
            LOGIN_WINDOW_MS,
        };

  if (
    attempt.count >=
    MAX_LOGIN_ATTEMPTS
  ) {
    return response
      .status(429)
      .json({
        message:
          '密码尝试次数过多，请稍后再试',
      });
  }

  if (
    !password ||
    !safeEqualText(
      password,
      configuredPassword,
    )
  ) {
    attempt.count += 1;

    loginAttempts.set(
      clientKey,
      attempt,
    );

    return response
      .status(401)
      .json({
        message:
          '后台密码错误',
      });
  }

  loginAttempts.delete(
    clientKey,
  );

  const token =
    randomBytes(32)
      .toString('hex');

  const expiresAt =
    Date.now() +
    SESSION_TTL_MS;

  sessions.set(
    token,
    expiresAt,
  );

  return response.json({
    token,
    expiresAt:
      new Date(
        expiresAt,
      ).toISOString(),
  });
}

export function adminSession(
  request: Request,
  response: Response,
) {
  const expiresAt =
    getSessionExpiry(request);

  if (expiresAt === null) {
    return response
      .status(401)
      .json({
        message:
          '后台凭证无效或已过期',
      });
  }

  return response.json({
    authenticated: true,
    expiresAt:
      new Date(
        expiresAt,
      ).toISOString(),
  });
}

export function adminLogout(
  request: Request,
  response: Response,
) {
  const token =
    readBearerToken(request);

  if (token) {
    sessions.delete(token);
  }

  return response
    .status(204)
    .send();
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    getSessionExpiry(
      request,
    ) === null
  ) {
    return response
      .status(401)
      .json({
        message:
          '需要后台权限',
      });
  }

  next();
}

export function protectAdminWrites(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    request.method === 'GET' ||
    request.method === 'HEAD' ||
    request.method === 'OPTIONS'
  ) {
    next();
    return;
  }

  requireAdmin(
    request,
    response,
    next,
  );
}
