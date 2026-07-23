import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/login', 'http://localhost:3100'), 302);
  response.cookies.delete('td_session');
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', 'http://localhost:3100'), 302);
  response.cookies.delete('td_session');
  return response;
}
