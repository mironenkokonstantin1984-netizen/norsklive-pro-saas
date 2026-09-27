import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as
    | 'magiclink'
    | 'email'
    | 'signup'
    | 'recovery'
    | null;

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(new URL('/login?error=1', requestUrl.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL('/login?error=1', requestUrl.origin));
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) {
        return NextResponse.redirect(new URL('/login?error=1', requestUrl.origin));
      }
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch {
    return NextResponse.redirect(new URL('/login?error=1', requestUrl.origin));
  }
}
