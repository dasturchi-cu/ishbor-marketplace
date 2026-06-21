const PENDING_PASSWORD_KEY = "ishbor-pending-registration-password";

export function setPendingRegistrationPassword(password: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PASSWORD_KEY, password);
}

export function consumePendingRegistrationPassword(): string {
  if (typeof window === "undefined") return "";
  const value = sessionStorage.getItem(PENDING_PASSWORD_KEY) ?? "";
  sessionStorage.removeItem(PENDING_PASSWORD_KEY);
  return value;
}
