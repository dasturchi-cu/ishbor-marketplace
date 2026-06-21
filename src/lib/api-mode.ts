/** Client-safe API mode flag. `remote` activates server-backed stores when available. */
export type ApiMode = "local" | "remote";

export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE;
  return mode === "remote" ? "remote" : "local";
}

export function isRemoteApiMode(): boolean {
  return getApiMode() === "remote";
}
