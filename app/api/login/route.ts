import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let username = '';
  let password = '';

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    username = body.username;
    password = body.password;
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    username = formData.get('username')?.toString() || '';
    password = formData.get('password')?.toString() || '';
  }

  if (username === 'demo' && password === 'demo123') {
    const response = NextResponse.json({ success: true, redirect: '/tasks' });
    response.cookies.set('td_session', 'ok', {
      path: '/',
      httpOnly: false, // Accessible for client / test assertions if needed
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.json(
    { success: false, error: 'Invalid credentials' },
    { status: 400 }
  );
}
