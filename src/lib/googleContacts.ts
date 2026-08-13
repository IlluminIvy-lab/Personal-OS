import { GoogleContact } from '../types';

export const fetchGoogleContacts = async (accessToken: string): Promise<GoogleContact[]> => {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos,organizations,addresses,biographies&pageSize=100&sortOrder=FIRST_NAME_ASCENDING';

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Contacts API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((item: any): GoogleContact => {
    const names = item.names || [];
    const primaryName = names.find((n: any) => n.metadata?.primary) || names[0];
    const emails = (item.emailAddresses || []).map((e: any) => ({
      value: e.value || '',
      type: e.type || 'work',
      primary: !!e.metadata?.primary,
    }));
    const phones = (item.phoneNumbers || []).map((p: any) => ({
      value: p.value || '',
      type: p.type || 'mobile',
      primary: !!p.metadata?.primary,
    }));
    const photos = (item.photos || []).map((ph: any) => ({
      url: ph.url || '',
      default: !!ph.default,
    }));
    const orgs = (item.organizations || []).map((o: any) => ({
      name: o.name || '',
      title: o.title || '',
      department: o.department || '',
    }));
    const addresses = (item.addresses || []).map((a: any) => ({
      formattedValue: a.formattedValue || '',
      type: a.type || 'home',
    }));
    const biographies = (item.biographies || []).map((b: any) => ({
      value: b.value || '',
    }));

    return {
      resourceName: item.resourceName || '',
      etag: item.etag,
      displayName: primaryName?.displayName || emails[0]?.value || 'Unnamed Contact',
      givenName: primaryName?.givenName || '',
      familyName: primaryName?.familyName || '',
      emailAddresses: emails,
      phoneNumbers: phones,
      photos,
      organizations: orgs,
      addresses,
      biographies,
    };
  });
};

export const createGoogleContact = async (
  accessToken: string,
  contact: {
    givenName: string;
    familyName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    company?: string;
    notes?: string;
  }
): Promise<GoogleContact> => {
  const payload: any = {
    names: [
      {
        givenName: contact.givenName,
        familyName: contact.familyName || '',
      },
    ],
  };

  if (contact.email) {
    payload.emailAddresses = [{ value: contact.email, type: 'work' }];
  }
  if (contact.phone) {
    payload.phoneNumbers = [{ value: contact.phone, type: 'mobile' }];
  }
  if (contact.jobTitle || contact.company) {
    payload.organizations = [
      {
        name: contact.company || '',
        title: contact.jobTitle || '',
      },
    ];
  }
  if (contact.notes) {
    payload.biographies = [{ value: contact.notes, contentType: 'TEXT_PLAIN' }];
  }

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create contact (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    resourceName: data.resourceName,
    displayName: `${contact.givenName} ${contact.familyName || ''}`.trim(),
    givenName: contact.givenName,
    familyName: contact.familyName,
    emailAddresses: contact.email ? [{ value: contact.email, primary: true }] : [],
    phoneNumbers: contact.phone ? [{ value: contact.phone, primary: true }] : [],
  };
};

export const deleteGoogleContact = async (
  accessToken: string,
  resourceName: string
): Promise<void> => {
  const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete contact (${res.status}): ${err}`);
  }
};
