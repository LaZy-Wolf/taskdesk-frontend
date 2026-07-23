import React from 'react';
import Link from 'next/link';
import { getTasks } from '@/lib/store';

export const revalidate = 0; // Dynamic route

interface TasksPageProps {
  searchParams?: { flash?: string };
}

export default function TasksPage({ searchParams }: TasksPageProps) {
  const tasks = getTasks();
  const flashMessage = searchParams?.flash || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">All Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track team tasks</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/tasks/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Task
          </Link>
          <Link
            href="/profile"
            className="text-slate-400 hover:text-slate-200 text-sm font-medium"
          >
            Profile
          </Link>
          <a
            href="/api/logout"
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Sign out
          </a>
        </div>
      </div>

      <div id="flash" className="text-emerald-400 text-sm font-semibold min-h-[1.25rem]">
        {flashMessage}
      </div>

      <div id="task-list" className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="task-row">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-indigo-300">{task.title}</h3>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  task.priority === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : task.priority === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {task.priority}
              </span>
            </div>
            <p className="text-sm text-slate-300">{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
