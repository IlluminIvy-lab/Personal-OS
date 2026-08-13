import { GoogleKeepNote } from '../types';

export const fetchGoogleKeepNotes = async (accessToken: string): Promise<GoogleKeepNote[]> => {
  try {
    const res = await fetch('https://keep.googleapis.com/v1/notes', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      // If enterprise permission denied or 403, throw descriptive error so UI can display guidance
      if (res.status === 403 || res.status === 404) {
        throw new Error(
          'Google Keep API is restricted by Google to enterprise/Workspace domain accounts. Personal OS Smart Notes is active with offline sync.'
        );
      }
      throw new Error(`Google Keep API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return (data.notes || []).map((n: any) => ({
      id: n.name || n.id,
      title: n.title || 'Untitled Note',
      bodyText: n.body?.text?.text || '',
      listItems: n.body?.list?.listItems?.map((li: any) => ({
        text: li.text?.text || '',
        isChecked: !!li.checked,
      })),
      createTime: n.createTime,
      updateTime: n.updateTime,
      trash: n.trash,
    }));
  } catch (err: any) {
    throw err;
  }
};

export const createGoogleKeepNote = async (
  accessToken: string,
  note: { title: string; text?: string; listItems?: { text: string; isChecked?: boolean }[] }
): Promise<GoogleKeepNote> => {
  let bodyPayload: any = {};

  if (note.listItems && note.listItems.length > 0) {
    bodyPayload = {
      list: {
        listItems: note.listItems.map((li) => ({
          text: { text: li.text },
          checked: !!li.isChecked,
        })),
      },
    };
  } else {
    bodyPayload = {
      text: {
        text: note.text || '',
      },
    };
  }

  const payload = {
    title: note.title,
    body: bodyPayload,
  };

  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Keep note (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    id: data.name || data.id,
    title: data.title || note.title,
    bodyText: note.text,
    listItems: note.listItems?.map((li) => ({
      text: li.text,
      isChecked: !!li.isChecked,
    })),
  };
};

export const deleteGoogleKeepNote = async (
  accessToken: string,
  noteNameOrId: string
): Promise<void> => {
  const resourceName = noteNameOrId.startsWith('notes/') ? noteNameOrId : `notes/${noteNameOrId}`;
  const res = await fetch(`https://keep.googleapis.com/v1/${resourceName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.text();
    throw new Error(`Failed to delete Keep note (${res.status}): ${err}`);
  }
};
