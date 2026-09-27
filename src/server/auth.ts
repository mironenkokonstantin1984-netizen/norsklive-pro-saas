import { createSupabaseServerClient } from '@/lib/supabase/server';

export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === 'true';
}

export async function getSessionUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  } catch {
    return null;
  }
}
