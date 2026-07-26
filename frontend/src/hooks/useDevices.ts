import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Device, DevicesResponse,
  ActivationCode, CodesResponse,
  GenerateCodeResponse, RevokeDeviceResponse, DeleteCodeResponse,
} from "../types/shared";
import { apiRequest, apiPost } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseDevicesResult {
  devices: Device[];
  codes: ActivationCode[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  generateCode: () => Promise<string>;
  revokeDevice: (deviceId: string) => Promise<void>;
  deleteCode: (code: string) => Promise<void>;
}

export function useDevices(): UseDevicesResult {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [codes, setCodes] = useState<ActivationCode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [devResult, codeResult] = await Promise.all([
        apiRequest<DevicesResponse>("getDevices"),
        apiRequest<CodesResponse>("getCodes"),
      ]);
      setDevices(devResult.devices);
      setCodes(codeResult.codes);
    } catch (err) {
      console.error("Failed to fetch devices/codes:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const intervalId = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchAll]);

  const genCode = useCallback(async (): Promise<string> => {
    const result = await apiPost<GenerateCodeResponse>("generateCode", {});
    fetchAll();
    return result.code;
  }, [fetchAll]);

  const revoke = useCallback(
    async (deviceId: string): Promise<void> => {
      await apiPost<RevokeDeviceResponse>("revokeDevice", { deviceId });
      fetchAll();
    },
    [fetchAll]
  );

  const delCode = useCallback(
    async (code: string): Promise<void> => {
      await apiPost<DeleteCodeResponse>("deleteCode", { code });
      fetchAll();
    },
    [fetchAll]
  );

  return {
    devices: useMemo(() => devices ?? [], [devices]),
    codes: useMemo(() => codes ?? [], [codes]),
    loading,
    error,
    refresh: fetchAll,
    generateCode: genCode,
    revokeDevice: revoke,
    deleteCode: delCode,
  };
}
