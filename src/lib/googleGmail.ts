import { GmailMessage } from '../types';

// Helper to decode Base64URL
const decodeBase64Url = (str: string): string => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
};

// Helper to encode string to RFC 2822 Base64URL
const encodeBase64Url = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const fetchGmailMessages = async (
  accessToken: string,
  options: {
    maxResults?: number;
    query?: string;
    labelIds?: string[];
  } = {}
): Promise<GmailMessage[]> => {
  const params = new URLSearchParams();
  params.set('maxResults', String(options.maxResults || 20));
  if (options.query) params.set('q', options.query);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((id) => params.append('labelIds', id));
  }

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${err}`);
  }

  const listData = await listRes.json();
  const rawList: Array<{ id: string; threadId: string }> = listData.messages || [];

  if (rawList.length === 0) return [];

  // Fetch full details for first 15 messages in parallel
  const detailPromises = rawList.slice(0, 15).map(async (msg) => {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (!msgRes.ok) return null;
      const data = await msgRes.json();
      return parseGmailMessage(data);
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(detailPromises);
  return resolved.filter((m): m is GmailMessage => m !== null);
};

const parseGmailMessage = (data: any): GmailMessage => {
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('subject') || '(No Subject)';
  const from = getHeader('from');
  const to = getHeader('to');
  const date = getHeader('date');

  let bodyHtml = '';
  let bodyText = '';

  const extractBody = (part: any) => {
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (data.payload) {
    if (data.payload.body?.data) {
      if (data.payload.mimeType === 'text/html') {
        bodyHtml = decodeBase64Url(data.payload.body.data);
      } else {
        bodyText = decodeBase64Url(data.payload.body.data);
      }
    }
    if (data.payload.parts) {
      data.payload.parts.forEach(extractBody);
    }
  }

  const labelIds: string[] = data.labelIds || [];

  return {
    id: data.id,
    threadId: data.threadId,
    labelIds,
    snippet: data.snippet || '',
    internalDate: data.internalDate || '',
    subject,
    from,
    to,
    date,
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || data.snippet || '',
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
  };
};

export const sendGmailMessage = async (
  accessToken: string,
  email: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }
): Promise<{ id: string; threadId: string }> => {
  const headers = [
    `To: ${email.to}`,
    email.cc ? `Cc: ${email.cc}` : null,
    email.bcc ? `Bcc: ${email.bcc}` : null,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(email.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ]
    .filter(Boolean)
    .join('\r\n');

  const rawMessage = `${headers}\r\n\r\n${email.body}`;
  const encodedRaw = encodeBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${errText}`);
  }

  return await res.json();
};

export const toggleGmailStar = async (
  accessToken: string,
  messageId: string,
  isStarred: boolean
): Promise<void> => {
  const body = isStarred
    ? { removeLabelIds: ['STARRED'] }
    : { addLabelIds: ['STARRED'] };

  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};
