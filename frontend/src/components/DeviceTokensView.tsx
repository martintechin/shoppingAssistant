import { useState } from "react";
import { t } from "../i18n";
import { useDevices } from "../hooks/useDevices";
import { getTokenInfo } from "../utils/tokenInfo";
import { formatRelativeDays, formatDate } from "../utils/dates";
import type { UseTokenExpiryResult } from "../hooks/useTokenExpiry";
import type { Device } from "../types/shared";

interface DeviceTokensViewProps {
  tokenExpiry: UseTokenExpiryResult;
}

export function DeviceTokensView({ tokenExpiry }: DeviceTokensViewProps) {
  const devices = useDevices();
  const tokenInfo = getTokenInfo();
  const currentDeviceId = tokenInfo?.deviceId;

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);

  async function handleGenerateCode() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const code = await devices.generateCode();
      setGeneratedCode(code);
      setCodeCopied(false);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : t("deviceTokens.generateFailed")
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyCode() {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCodeCopied(true);
    } catch {
      // Fallback: select-and-copy not needed for modern browsers
    }
  }

  async function handleRevoke(deviceId: string) {
    if (confirmingRevoke !== deviceId) {
      setConfirmingRevoke(deviceId);
      return;
    }
    setConfirmingRevoke(null);
    setRevokeError(null);
    try {
      await devices.revokeDevice(deviceId);
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : t("deviceTokens.revokeFailed")
      );
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1>{t("deviceTokens.title")}</h1>
      </div>

      {tokenExpiry.isExpiringSoon && (
        <div className="banner-warning">
          <span>
            {t("deviceTokens.expiryWarning", {
              days: tokenExpiry.daysUntilExpiry,
            })}
          </span>
          <button
            className="btn-link-warning"
            onClick={tokenExpiry.renew}
            disabled={tokenExpiry.renewing}
          >
            {tokenExpiry.renewing
              ? t("deviceTokens.renewing")
              : t("deviceTokens.renew")}
          </button>
        </div>
      )}

      {tokenExpiry.renewed && (
        <div className="banner-hint">{t("deviceTokens.renewed")}</div>
      )}

      {tokenExpiry.renewError && (
        <div className="banner-error">{tokenExpiry.renewError}</div>
      )}

      {revokeError && <div className="banner-error">{revokeError}</div>}

      {devices.loading && !devices.devices.length && (
        <div className="empty-state">{t("deviceTokens.loading")}</div>
      )}

      {!devices.loading && devices.devices.length === 0 && (
        <div className="empty-state">{t("deviceTokens.empty")}</div>
      )}

      {devices.error && <div className="banner-error">{devices.error}</div>}

      {devices.devices.length > 0 && (
        <div className="device-list">
          {devices.devices.map((device: Device) => {
            const isCurrent = device.id === currentDeviceId;
            return (
              <div key={device.id} className="device-row">
                <div className="device-info">
                  <div className="device-name">
                    {device.name || t("deviceTokens.unnamed")}
                    {isCurrent && (
                      <span className="device-badge">
                        {t("deviceTokens.thisDevice")}
                      </span>
                    )}
                  </div>
                  <div className="device-meta">
                    {t("deviceTokens.activatedAt", {
                      date: formatDate(device.activatedAt),
                    })}
                    {" · "}
                    {device.lastUsedAt
                      ? t("deviceTokens.lastUsed", {
                          when: formatRelativeDays(device.lastUsedAt),
                        })
                      : t("deviceTokens.lastUsedNever")}
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    className={
                      confirmingRevoke === device.id
                        ? "btn-small btn-danger"
                        : "btn-small btn-danger-outline"
                    }
                    onClick={() => handleRevoke(device.id)}
                    onBlur={() => {
                      if (confirmingRevoke === device.id)
                        setConfirmingRevoke(null);
                    }}
                  >
                    {confirmingRevoke === device.id
                      ? t("deviceTokens.confirmRevoke")
                      : t("deviceTokens.revoke")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="device-generate-section">
        {generatedCode ? (
          <div className="generated-code-box">
            <div className="generated-code-label">
              {t("deviceTokens.generatedCode")}
            </div>
            <div className="generated-code-value">{generatedCode}</div>
            <div className="generated-code-hint">
              {t("deviceTokens.codeHint")}
            </div>
            <div className="generated-code-actions">
              <button className="btn-small btn-primary" onClick={handleCopyCode}>
                {codeCopied
                  ? t("deviceTokens.codeCopied")
                  : t("deviceTokens.copyCode")}
              </button>
              <button
                className="btn-small btn-secondary"
                onClick={() => {
                  setGeneratedCode(null);
                  setCodeCopied(false);
                }}
              >
                {t("deviceTokens.dismiss")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={handleGenerateCode}
              disabled={generating}
            >
              {generating
                ? t("deviceTokens.generating")
                : t("deviceTokens.generateCode")}
            </button>
            {generateError && (
              <div className="banner-error">{generateError}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
