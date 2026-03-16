import axios from 'axios';
import config from 'src/config';
import { AuthUser } from 'src/types';

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public key?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function verifyToken(token: string, countryCode: string): Promise<AuthUser> {
  try {
    const response = await axios.get<{ success: boolean; data: AuthUser }>(
      `${config.ENV_API_SERVER_URL}/api/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'client-country-code': countryCode,
        },
        timeout: 10_000,
      },
    );
    return response.data.data;
  } catch (error: any) {
    const status = error.response?.status || 401;
    const message = error.response?.data?.message || 'Authentication failed';
    const key = error.response?.data?.key;
    throw new AuthError(status, message, key);
  }
}
