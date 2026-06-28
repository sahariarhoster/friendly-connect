export type BaseFieldKey = "phone" | "portfolio_url" | "resume" | "cover_letter";

export type BaseFieldConfig = {
  enabled: boolean;
  required: boolean;
};

export type BaseFieldsConfig = Partial<Record<BaseFieldKey, BaseFieldConfig>>;

export const BASE_FIELD_LABELS: Record<BaseFieldKey, string> = {
  phone: "Phone",
  portfolio_url: "Portfolio / LinkedIn URL",
  resume: "Resume (PDF/DOC)",
  cover_letter: "Cover letter",
};

export const BASE_FIELD_DEFAULTS: Record<BaseFieldKey, BaseFieldConfig> = {
  phone: { enabled: true, required: false },
  portfolio_url: { enabled: true, required: false },
  resume: { enabled: true, required: false },
  cover_letter: { enabled: true, required: false },
};

export function getBaseField(
  config: BaseFieldsConfig | null | undefined,
  key: BaseFieldKey,
): BaseFieldConfig {
  return { ...BASE_FIELD_DEFAULTS[key], ...(config?.[key] ?? {}) };
}
