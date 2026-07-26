const LANG_TO_LOCALE: Record<string, string> = { en: "en-US", sv: "sv-SE" };
export const APP_LOCALE = LANG_TO_LOCALE[process.env.APP_LANGUAGE || "en"] || "en-US";
