/** Input normalization for auth and forms. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "-");
}

export function sanitizeText(input: string, maxLength = 5000): string {
  return input.trim().slice(0, maxLength);
}
