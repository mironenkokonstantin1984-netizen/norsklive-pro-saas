import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Proceed to redirect even if session clear throws
  }
  return NextResponse.redirect(new URL('/login', requestUrl.origin), {
    status: 303,
  });
}
