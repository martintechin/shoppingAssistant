import { useState, useCallback } from "react";
import { getTokenInfo } from "../utils/tokenInfo";
import { apiPost, setAuthToken } from "../utils/api";
import { RenewTokenResponse } from "../types/shared";

export interface UseTokenExpiryResult {
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  renew: () => Promise<void>;
  renewing: boolean;
  renewed: boolean;
  renewError: string | null;
}

export function useTokenExpiry(): UseTokenExpiryResult {
  const info = getTokenInfo();
  const [renewed, setRenewed] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const renew = useCallback(async () => {
    setRenewing(true);
    setRenewError(null);
    try {
      const result = await apiPost<RenewTokenResponse>("renewToken", {});
      setAuthToken(result.token);
      setRenewed(true);
      setDismissed(true);
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : "Renewal failed");
    } finally {
      setRenewing(false);
    }
  }, []);

  return {
    isExpiringSoon: !dismissed && (info?.isExpiringSoon ?? false),
    daysUntilExpiry: info?.daysUntilExpiry ?? 0,
    renew,
    renewing,
    renewed,
    renewError,
  };
}
