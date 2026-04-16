const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly";
const DRIVE_FILE_FIELDS = "id,name,webViewLink";
const DRIVE_LIST_FIELDS = "files(id,name,modifiedTime,webViewLink)";

type UploadPayload = {
  csv: string;
  fileName: string;
  existingFileId?: string | null;
};

type GoogleDriveFileResponse = {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  expires_in?: number;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

export type DriveCsvFile = {
  id: string;
  name: string;
  webViewLink: string | null;
  modifiedTime: string | null;
};

let gisScriptPromise: Promise<void> | null = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;

export async function uploadCsvToDrive({
  csv,
  fileName,
  existingFileId = null,
}: UploadPayload) {
  const token = await getAccessToken();
  const metadata = {
    name: fileName,
    mimeType: "text/csv",
  };
  const boundary = `estimate-constructor-${crypto.randomUUID()}`;
  const requestBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/csv",
    "",
    csv,
    `--${boundary}--`,
  ].join("\r\n");

  const method = existingFileId ? "PATCH" : "POST";
  const endpoint = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=${DRIVE_FILE_FIELDS}`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${DRIVE_FILE_FIELDS}`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Google Drive вернул ошибку ${response.status}: ${details || "unknown error"}`,
    );
  }

  const file = (await response.json()) as GoogleDriveFileResponse;

  return {
    id: file.id,
    name: file.name,
    webViewLink: file.webViewLink ?? null,
  };
}

export async function listCsvFilesFromDrive() {
  const token = await getAccessToken();
  const query = encodeURIComponent("mimeType='text/csv' and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=50&orderBy=modifiedTime desc&fields=${encodeURIComponent(
      DRIVE_LIST_FIELDS,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Не удалось получить список CSV из Google Drive: ${response.status} ${details || ""}`,
    );
  }

  const data = (await response.json()) as {
    files?: GoogleDriveFileResponse[];
  };

  return (data.files ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    webViewLink: file.webViewLink ?? null,
    modifiedTime: file.modifiedTime ?? null,
  }));
}

export async function downloadCsvFromDrive(fileId: string) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Не удалось скачать CSV из Google Drive: ${response.status} ${details || ""}`,
    );
  }

  return response.text();
}

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && tokenExpiresAt > now + 30_000) {
    return accessToken;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Интеграция Google Drive пока не настроена. Обратись к администратору приложения.",
    );
  }

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    const googleClient = window.google?.accounts?.oauth2;

    if (!googleClient) {
      reject(new Error("Не удалось инициализировать вход через Google."));
      return;
    }

    const tokenClient = googleClient.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error || "Не удалось получить доступ к Google Drive.",
            ),
          );
          return;
        }

        accessToken = response.access_token;
        tokenExpiresAt = Date.now() + (response.expires_in ?? 0) * 1000;
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({
      prompt: accessToken ? "" : "consent",
    });
  });
}

async function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) {
    return;
  }

  if (!gisScriptPromise) {
    gisScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Не удалось подключить сервис авторизации Google."));
      document.head.appendChild(script);
    });
  }

  await gisScriptPromise;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}
