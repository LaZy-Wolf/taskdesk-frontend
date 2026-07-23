import React from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-100">Profile</h1>
        <div className="flex items-center space-x-4">
          <Link href="/tasks" className="text-sm text-slate-400 hover:text-slate-200">
            Tasks
          </Link>
          <a href="/api/logout" className="text-red-400 hover:text-red-300 text-sm font-medium">
            Sign out
          </a>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <div>
          <span className="text-sm text-slate-400 block mb-1">Authenticated User:</span>
          <span id="profile-user" className="text-xl font-semibold text-indigo-300">
            demo
          </span>
        </div>

        <div className="pt-2">
          <p className="text-xs text-slate-400">Role: Administrator / Demo Operator</p>
        </div>
      </div>
    </div>
  );
}
