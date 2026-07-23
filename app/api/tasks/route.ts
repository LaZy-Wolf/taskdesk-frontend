import { NextResponse } from 'next/server';
import { getTasks, addTask } from '@/lib/store';

export async function GET() {
  const tasks = getTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  let title = '';
  let description = '';
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    title = body.title || '';
    description = body.description || '';
    priority = body.priority || 'Medium';
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    title = formData.get('title')?.toString() || '';
    description = formData.get('description')?.toString() || '';
    priority = (formData.get('priority')?.toString() as 'Low' | 'Medium' | 'High') || 'Medium';
  }

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const created = addTask({ title, description, priority });
  return NextResponse.json(created, { status: 201 });
}
