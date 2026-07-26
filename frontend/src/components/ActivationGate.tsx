import { useState, useEffect, ReactNode, FormEvent } from "react";
import { API_BASE, getAuthToken, setAuthToken, onAuthExpired } from "../utils/api";
import { t } from "../i18n";

interface ActivationGateProps {
  children: ReactNode;
}

export function ActivationGate({ children }: ActivationGateProps) {
  const [authenticated, setAuthenticated] = useState(() => !!getAuthToken());
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthExpired(() => setAuthenticated(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError(t("activation.emptyCode"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode, name: name.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `${t("activation.failed")} (${res.status})`);
      }

      const { token } = await res.json();
      setAuthToken(token);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("activation.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="activation-gate">
      <div className="activation-card">
        <h1>{t("activation.title")}</h1>
        <p>{t("activation.description")}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="activation-code">{t("activation.codeLabel")}</label>
            <input
              id="activation-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="device-name">{t("activation.deviceLabel")}</label>
            <input
              id="device-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("activation.devicePlaceholder")}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t("activation.submitting") : t("activation.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
