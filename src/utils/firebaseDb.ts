/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  ExperimentMetadata, 
  SoilPrep, 
  CameraConfig, 
  RoiConfig, 
  KineticsConfig, 
  SampleData 
} from "../types";

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface SavedExperiment {
  id: string;
  metadata: ExperimentMetadata;
  prep: SoilPrep;
  camera: CameraConfig;
  roi: RoiConfig;
  kinetics: KineticsConfig;
  samples: SampleData[];
  createdAt: string;
  selectedFolderId?: string;
  driveImages?: any[];
  kineticsProcessed?: boolean;
}

const EXPERIMENTS_COLLECTION = "experiments";

/**
 * Saves a complete experiment session to Firestore
 */
export async function saveExperimentToCloud(
  idSesion: string,
  metadata: ExperimentMetadata,
  prep: SoilPrep,
  camera: CameraConfig,
  roi: RoiConfig,
  kinetics: KineticsConfig,
  samples: SampleData[],
  selectedFolderId?: string,
  driveImages?: any[],
  kineticsProcessed?: boolean
): Promise<string> {
  const docId = idSesion || `EXP-${Date.now()}`;
  const docRef = doc(db, EXPERIMENTS_COLLECTION, docId);
  
  const payload: Omit<SavedExperiment, "id"> = {
    metadata,
    prep,
    camera,
    roi,
    kinetics,
    samples,
    createdAt: new Date().toISOString(),
    selectedFolderId,
    driveImages,
    kineticsProcessed
  };

  await setDoc(docRef, payload, { merge: true });
  return docId;
}

/**
 * Fetches all experiments saved in Firestore
 */
export async function getExperimentsFromCloud(): Promise<SavedExperiment[]> {
  try {
    const q = query(collection(db, EXPERIMENTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const results: SavedExperiment[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        metadata: data.metadata,
        prep: data.prep,
        camera: data.camera,
        roi: data.roi,
        kinetics: data.kinetics,
        samples: data.samples || [],
        createdAt: data.createdAt || "",
        selectedFolderId: data.selectedFolderId || "",
        driveImages: data.driveImages || [],
        kineticsProcessed: data.kineticsProcessed || false
      });
    });

    // Sort by createdAt descending
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error("Error al obtener experimentos de la nube:", error);
    throw error;
  }
}

/**
 * Deletes an experiment from Firestore
 */
export async function deleteExperimentFromCloud(id: string): Promise<void> {
  const docRef = doc(db, EXPERIMENTS_COLLECTION, id);
  await deleteDoc(docRef);
}
