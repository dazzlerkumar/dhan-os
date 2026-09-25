export interface Session {
  userId?: number;
}

export async function getSession(): Promise<Session | null> {
  return null;
}
