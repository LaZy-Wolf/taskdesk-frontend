export interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  createdAt: string;
}

const SEED_TASKS: Task[] = [
  {
    id: '1',
    title: 'Write spec',
    priority: 'High',
    description: 'Write TaskDesk specifications',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Fix login bug',
    priority: 'Medium',
    description: 'Resolve cookie session handling issue',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Ship release',
    priority: 'Low',
    description: 'Deploy initial v1 release',
    createdAt: new Date().toISOString(),
  },
];

// In-memory store persistent during node process runtime
let tasks: Task[] = [...SEED_TASKS];

export function getTasks(): Task[] {
  return tasks;
}

export function addTask(newTask: Omit<Task, 'id' | 'createdAt'>): Task {
  const task: Task = {
    ...newTask,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
}

export function resetStore(): void {
  tasks = [...SEED_TASKS];
}
