import type { TFunction } from "i18next";

/**
 * Clerk 的原始错误 code 不适合直接给用户看(英文、技术化)。这里把常见 code 映射到
 * 人话 i18n key;未覆盖的落到 generic。见 brief §7。
 */
const CODE_TO_KEY: Record<string, string> = {
  form_password_incorrect: "auth.errors.passwordIncorrect",
  form_identifier_not_found: "auth.errors.identifierNotFound",
  form_identifier_exists: "auth.errors.identifierExists",
  form_code_incorrect: "auth.errors.codeIncorrect",
  verification_expired: "auth.errors.codeExpired",
  verification_failed: "auth.errors.codeIncorrect",
  form_password_pwned: "auth.errors.passwordWeak",
  form_password_length_too_short: "auth.errors.passwordWeak",
  form_password_validation_failed: "auth.errors.passwordWeak",
  form_param_format_invalid: "auth.errors.emailInvalid",
  too_many_requests: "auth.errors.rateLimited",
  captcha_invalid: "auth.errors.rateLimited",
};

const extractCode = (err: unknown): string | undefined => {
  if (typeof err !== "object" || err === null) return undefined;
  const errors = (err as { errors?: Array<{ code?: string }> }).errors;
  return Array.isArray(errors) && errors.length > 0 ? errors[0]?.code : undefined;
};

export const getClerkErrorMessage = (err: unknown, t: TFunction): string => {
  const code = extractCode(err);
  if (code && CODE_TO_KEY[code]) return t(CODE_TO_KEY[code]);
  return t("auth.errors.generic");
};
