import { getAuthToken } from "./api";

export interface TokenInfo {
  deviceId: string;
  expiresAt: Date;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
}

const EXPIRY_WARNING_DAYS = 30;

export function getTokenInfo(): TokenInfo | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const deviceId = payload.deviceId as string;
    const exp = payload.exp as number;
    if (!deviceId || !exp) return null;

    const expiresAt = new Date(exp * 1000);
    const daysUntilExpiry = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return {
      deviceId,
      expiresAt,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= EXPIRY_WARNING_DAYS,
    };
  } catch {
    return null;
  }
}
