import { GooglePickerDocument } from '../types';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

let isGapiLoaded = false;
let isPickerLoaded = false;

// Dynamically load Google API script (gapi)
export const loadGooglePickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    if (window.google?.picker && isPickerLoaded) {
      return resolve();
    }

    if (window.gapi) {
      window.gapi.load('picker', {
        callback: () => {
          isPickerLoaded = true;
          resolve();
        },
        onerror: () => reject(new Error('Failed to load Google Picker via gapi.load')),
      });
      return;
    }

    // Check if script element is already added
    const existingScript = document.getElementById('google-api-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.gapi.load('picker', {
          callback: () => {
            isPickerLoaded = true;
            resolve();
          },
          onerror: () => reject(new Error('Failed to load Google Picker')),
        });
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-api-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGapiLoaded = true;
      window.gapi.load('picker', {
        callback: () => {
          isPickerLoaded = true;
          resolve();
        },
        onerror: () => reject(new Error('Failed to load Google Picker module')),
      });
    };
    script.onerror = () => reject(new Error('Failed to download Google API script from CDN'));
    document.body.appendChild(script);
  });
};

export interface OpenPickerOptions {
  accessToken: string;
  viewType?: 'all' | 'documents' | 'spreadsheets' | 'presentations' | 'images' | 'folders';
  multiselect?: boolean;
  onPicked: (docs: GooglePickerDocument[]) => void;
  onCancel?: () => void;
  title?: string;
}

export const openGooglePicker = async ({
  accessToken,
  viewType = 'all',
  multiselect = true,
  onPicked,
  onCancel,
  title = 'Select Google Drive File',
}: OpenPickerOptions): Promise<void> => {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required to open Google Picker.');
  }

  await loadGooglePickerApi();

  if (!window.google?.picker) {
    throw new Error('Google Picker library is not ready.');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  const builder = new window.google.picker.PickerBuilder()
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setTitle(title);

  if (multiselect) {
    builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
  }

  // Choose appropriate view based on viewType
  if (viewType === 'documents') {
    builder.addView(window.google.picker.ViewId.DOCS);
  } else if (viewType === 'spreadsheets') {
    builder.addView(window.google.picker.ViewId.SPREADSHEETS);
  } else if (viewType === 'presentations') {
    builder.addView(window.google.picker.ViewId.PRESENTATIONS);
  } else if (viewType === 'images') {
    builder.addView(window.google.picker.ViewId.DOCS_IMAGES);
  } else if (viewType === 'folders') {
    builder.addView(
      new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS).setIncludeFolders(true)
    );
  } else {
    // Default: all docs & files
    builder.addView(window.google.picker.ViewId.DOCS);
    builder.addView(window.google.picker.ViewId.SPREADSHEETS);
    builder.addView(window.google.picker.ViewId.DOCS_IMAGES);
  }

  builder.setCallback((data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const rawDocs = data.docs || [];
      const documents: GooglePickerDocument[] = rawDocs.map((doc: any) => ({
        id: doc.id,
        name: doc.name || 'Untitled Document',
        mimeType: doc.mimeType || 'application/octet-stream',
        url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
        iconUrl: doc.iconUrl,
        sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : undefined,
        lastEditedUtc: doc.lastEditedUtc ? Number(doc.lastEditedUtc) : undefined,
      }));
      onPicked(documents);
    } else if (data.action === window.google.picker.Action.CANCEL) {
      if (onCancel) onCancel();
    }
  });

  const picker = builder.build();
  picker.setVisible(true);
};
