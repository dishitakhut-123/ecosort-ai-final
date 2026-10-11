const KEY = "ecosort.operator";

export function signIn(email: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, email);
}

export function signOut() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export function getOperator(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}
