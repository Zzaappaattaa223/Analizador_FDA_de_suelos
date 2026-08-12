/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// =========================================================================
// GOOGLE DRIVE & GOOGLE SHEETS AUTHENTICATION & API CONTROLLER
// =========================================================================

export const DEFAULT_ROOT_FOLDER_ID = "1tDJMIgNXfi7m98T2A7fSvxcQsikFWtFt";
export const DEFAULT_MASTER_SHEET_ID = "1a_s0P-po3b-G-LPhsb_qYSgarkKzxMwi76_0SInPNdE";
export const DEFAULT_EXP_SHEET_ID = "1WymPRldxkG-wrn58EcTKTY2nnQplKmL9pXr35HWKLNc";

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  isSharedWithMe?: boolean;
  shared?: boolean;
  capabilities?: {
    canAddChildren?: boolean;
    canEdit?: boolean;
  };
  owners?: { displayName: string; emailAddress?: string }[];
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

/**
 * Initializes and triggers Google Auth token authorization via Firebase Auth Popup.
 * Requests full scopes to Drive and Sheets to ensure real write/read capability.
 */
export async function authorizeGoogleWorkspace(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No se pudo obtener el token de acceso de Google desde Firebase Auth.");
    }
    return credential.accessToken;
  } catch (error: any) {
    console.error("Error al iniciar sesión con Google:", error);
    throw new Error(`Error de autenticación Google: ${error.message || error}`);
  }
}

/**
 * Lists subfolders under a parent Google Drive folder.
 */
export async function listDriveSubfolders(
  accessToken: string,
  parentFolderId?: string
): Promise<GoogleDriveFile[]> {
  const activeParentId = parentFolderId || localStorage.getItem("fda_root_folder_id") || DEFAULT_ROOT_FOLDER_ID;
  const query = `'${activeParentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,capabilities,shared,owners)&orderBy=name`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error en Google Drive al listar carpetas: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  let folders: GoogleDriveFile[] = data.files || [];

  // If we are at the root, also append folders that are explicitly shared with the user
  if (activeParentId === "root") {
    try {
      const sharedQuery = `sharedWithMe = true and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const sharedUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(sharedQuery)}&fields=files(id,name,createdTime,capabilities,shared,owners)&orderBy=name`;
      
      const sharedResponse = await fetch(sharedUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (sharedResponse.ok) {
        const sharedData = await sharedResponse.json();
        const sharedFolders: GoogleDriveFile[] = (sharedData.files || []).map((f: any) => ({
          ...f,
          isSharedWithMe: true,
          shared: true
        }));
        
        // Merge without duplicate IDs
        const existingIds = new Set(folders.map(f => f.id));
        sharedFolders.forEach(sf => {
          if (!existingIds.has(sf.id)) {
            folders.push(sf);
          }
        });
      }
    } catch (e) {
      console.warn("No se pudieron cargar carpetas compartidas con el usuario:", e);
    }
  }

  return folders;
}

/**
 * Creates a brand new Google Spreadsheet in the user's Drive.
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string
): Promise<string> {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";
  const body = {
    properties: {
      title: title,
    },
    sheets: [
      {
        properties: {
          title: "Sheet1"
        }
      }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al crear la planilla de Google: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.spreadsheetId;
}

/**
 * Creates a new subfolder in Google Drive.
 */
export async function createDriveSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const url = "https://www.googleapis.com/drive/v3/files";
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentFolderId],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al crear carpeta en Google Drive: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Lists all image files in a selected Google Drive folder.
 */
export async function listFolderImages(
  accessToken: string,
  folderId: string
): Promise<GoogleDriveFile[]> {
  const query = `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png') and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&orderBy=name`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al listar imágenes de Google Drive: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads an image file from Google Drive and returns it as a Blob Object URL.
 */
export async function downloadDriveImageBlob(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al descargar imagen ${fileId} de Google Drive: ${errData.error?.message || response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Writes tabular kinetics data to a specific Google Sheet (overwriting Sheet1).
 */
export async function writeKineticsToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  headers: string[],
  rows: any[][]
): Promise<void> {
  // 1. Clear existing sheet contents (Sheet1!A1:Z1000)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1000:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  // 2. Format values matrix with headers at row 0
  const values = [headers, ...rows];

  // 3. Write data to Sheet1!A1
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: "Sheet1!A1",
      majorDimension: "ROWS",
      values: values,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al escribir en Google Sheets: ${errData.error?.message || response.statusText}`);
  }
}

/**
 * Appends a summary log row to the Master Sheet (Sheet1).
 */
export async function appendSummaryToMasterSheet(
  accessToken: string,
  spreadsheetId: string,
  rowValues: any[]
): Promise<void> {
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:A:append?valueInputOption=USER_ENTERED`;
  const response = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: "Sheet1!A:A",
      majorDimension: "ROWS",
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al registrar en Planilla Maestra: ${errData.error?.message || response.statusText}`);
  }
}

/**
 * Reads logs from the Master Sheet to present to the user in a consolidated table.
 */
export async function readMasterSheetLogs(
  accessToken: string,
  spreadsheetId: string
): Promise<any[][]> {
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:F500`;
  const response = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Error al leer de la Planilla Maestra: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.values || [];
}
