import { useState, useEffect, useCallback, useMemo } from "react";
import { Device, DevicesResponse, GenerateCodeResponse, RevokeDeviceResponse } from "../types/shared";
import { apiRequest, apiPost } from "../utils/api";
import { REFRESH_INTERVAL } from "../config";

export interface UseDevicesResult {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  generateCode: () => Promise<string>;
  revokeDevice: (deviceId: string) => Promise<void>;
}

export function useDevices(): UseDevicesResult {
  const [data, setData] = useState<Device[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<DevicesResponse>("getDevices");
      setData(result.devices);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const intervalId = setInterval(fetchDevices, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchDevices]);

  const genCode = useCallback(async (): Promise<string> => {
    const result = await apiPost<GenerateCodeResponse>("generateCode", {});
    fetchDevices();
    return result.code;
  }, [fetchDevices]);

  const revoke = useCallback(
    async (deviceId: string): Promise<void> => {
      await apiPost<RevokeDeviceResponse>("revokeDevice", { deviceId });
      fetchDevices();
    },
    [fetchDevices]
  );

  const devices = useMemo(() => data ?? [], [data]);

  return {
    devices,
    loading,
    error,
    refresh: fetchDevices,
    generateCode: genCode,
    revokeDevice: revoke,
  };
}
