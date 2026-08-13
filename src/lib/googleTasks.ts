import { GoogleTask, GoogleTaskList } from '../types';

export const fetchGoogleTaskLists = async (accessToken: string): Promise<GoogleTaskList[]> => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Tasks API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || 'Tasks',
    updated: item.updated,
  }));
};

export const fetchGoogleTasks = async (
  accessToken: string,
  taskListId: string = '@default'
): Promise<GoogleTask[]> => {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Tasks API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.items || [])
    .filter((t: any) => t.title && t.title.trim())
    .map((item: any): GoogleTask => ({
      id: item.id,
      title: item.title,
      notes: item.notes || '',
      status: item.status === 'completed' ? 'completed' : 'needsAction',
      due: item.due,
      completed: item.completed,
      updated: item.updated,
      parent: item.parent,
      position: item.position,
      taskListId,
    }));
};

export const createGoogleTask = async (
  accessToken: string,
  taskListId: string = '@default',
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
  }
): Promise<GoogleTask> => {
  const body: any = {
    title: task.title,
  };
  if (task.notes) body.notes = task.notes;
  if (task.due) body.due = task.due.includes('T') ? task.due : `${task.due}T00:00:00.000Z`;

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google Task (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    status: data.status === 'completed' ? 'completed' : 'needsAction',
    due: data.due,
    taskListId,
  };
};

export const updateGoogleTaskStatus = async (
  accessToken: string,
  taskListId: string,
  taskId: string,
  completed: boolean
): Promise<GoogleTask> => {
  const body: any = {
    status: completed ? 'completed' : 'needsAction',
  };
  if (!completed) {
    body.completed = null;
  }

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update task status (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    status: data.status === 'completed' ? 'completed' : 'needsAction',
    due: data.due,
    taskListId,
  };
};

export const deleteGoogleTask = async (
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> => {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete task (${res.status}): ${err}`);
  }
};
