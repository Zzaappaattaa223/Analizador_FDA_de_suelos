/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  DEFAULT_METADATA, 
  DEFAULT_SOIL_PREP, 
  DEFAULT_CAMERA_CONFIG, 
  DEFAULT_ROI_CONFIG, 
  DEFAULT_KINETICS_CONFIG, 
  INITIAL_SAMPLES 
} from "./data/mockData";
import { 
  ExperimentMetadata, 
  SoilPrep, 
  CameraConfig, 
  RoiConfig, 
  KineticsConfig, 
  SampleData 
} from "./types";

// Modular tab components
import Tab1Registro from "./components/Tab1Registro";
import Tab2Preprocesamiento from "./components/Tab2Preprocesamiento";
import Tab3Camera from "./components/Tab3Camera";
import Tab4ROI from "./components/Tab4ROI";
import Tab5Kinetics from "./components/Tab5Kinetics";
import Tab6Export from "./components/Tab6Export";

// Firebase/Firestore Database Service
import {
  saveExperimentToCloud,
  getExperimentsFromCloud,
  deleteExperimentFromCloud,
  SavedExperiment
} from "./utils/firebaseDb";

// Icons
import { 
  Activity,
  Settings,
  Database,
  FlaskConical,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  ClipboardList,
  Sprout,
  Camera as CameraIcon,
  Target,
  FileDown
} from "lucide-react";

// Google Workspace Services
import {
  authorizeGoogleWorkspace,
  listDriveSubfolders,
  listFolderImages,
  downloadDriveImageBlob,
  writeKineticsToSpreadsheet,
  appendSummaryToMasterSheet,
  readMasterSheetLogs,
  createDriveSubfolder,
  createGoogleSpreadsheet,
  DEFAULT_ROOT_FOLDER_ID,
  DEFAULT_MASTER_SHEET_ID,
  DEFAULT_EXP_SHEET_ID,
  GoogleDriveFile
} from "./utils/googleService";

import {
  drawImageToCanvas,
  calibrateOpticsT0,
  extractRealKinetics
} from "./utils/imageProcessor";

export default function App() {
  // Global States
  const [metadata, setMetadata] = useState<ExperimentMetadata>(DEFAULT_METADATA);
  const [prep, setPrep] = useState<SoilPrep>(DEFAULT_SOIL_PREP);
  const [camera, setCamera] = useState<CameraConfig>(DEFAULT_CAMERA_CONFIG);
  const [roi, setRoi] = useState<RoiConfig>(DEFAULT_ROI_CONFIG);
  const [kinetics, setKinetics] = useState<KineticsConfig>(DEFAULT_KINETICS_CONFIG);
  const [samples, setSamples] = useState<SampleData[]>(INITIAL_SAMPLES);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<number>(0);

  // Google OAuth & Real Data States
  const [googleToken, setGoogleToken] = useState<string | null>(() => localStorage.getItem("fda_google_access_token"));
  const [driveFolders, setDriveFolders] = useState<GoogleDriveFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [driveImages, setDriveImages] = useState<GoogleDriveFile[]>([]);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [masterLogs, setMasterLogs] = useState<any[][]>([]);

  // Configurable Google Workspace Resource IDs
  const [rootFolderId, setRootFolderId] = useState<string>(() => localStorage.getItem("fda_root_folder_id") || DEFAULT_ROOT_FOLDER_ID);
  const [masterSheetId, setMasterSheetId] = useState<string>(() => localStorage.getItem("fda_master_sheet_id") || DEFAULT_MASTER_SHEET_ID);
  const [expSheetId, setExpSheetId] = useState<string>(() => localStorage.getItem("fda_exp_sheet_id") || DEFAULT_EXP_SHEET_ID);
  
  // Image Processing Pipeline States
  const [isCalibratingROI, setIsCalibratingROI] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<any | null>(null);
  const [calibrationImageUrl, setCalibrationImageUrl] = useState<string | null>(null);
  const [isAnalyzingKinetics, setIsAnalyzingKinetics] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentFrameName, setCurrentFrameName] = useState("");
  const [kineticsProcessed, setKineticsProcessed] = useState(false);

  // Firestore Database States
  const [cloudExperiments, setCloudExperiments] = useState<SavedExperiment[]>([]);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Load Cloud Firestore experiments on boot
  useEffect(() => {
    handleLoadCloudExperiments();
  }, []);

  const handleLoadCloudExperiments = async () => {
    setIsLoadingCloud(true);
    try {
      const exps = await getExperimentsFromCloud();
      setCloudExperiments(exps);
    } catch (err) {
      console.error("Error al cargar experimentos de Firestore:", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleSaveToCloud = async () => {
    setIsSavingToCloud(true);
    try {
      const docId = await saveExperimentToCloud(
        metadata.idSesion,
        metadata,
        prep,
        camera,
        roi,
        kinetics,
        samples
      );
      alert(`✅ Ensayo "${metadata.nombreExp}" guardado con éxito en Cloud Firestore!\nID del documento: ${docId}`);
      await handleLoadCloudExperiments();
    } catch (err: any) {
      alert(`Error al guardar en Firestore: ${err.message || err}`);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleLoadFromCloud = (exp: SavedExperiment) => {
    if (!exp) return;
    setMetadata(exp.metadata);
    setPrep(exp.prep);
    setCamera(exp.camera);
    setRoi(exp.roi);
    setKinetics(exp.kinetics);
    setSamples(exp.samples);
    setKineticsProcessed(true); // Since it was saved with computed kinetics
    alert(`✅ Sesión "${exp.metadata.nombreExp}" recuperada de Cloud Firestore exitosamente! Todos los canales y mediciones han sido restaurados.`);
  };

  const handleDeleteFromCloud = async (id: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el ensayo "${id}" permanentemente de Cloud Firestore?`)) {
      return;
    }
    try {
      await deleteExperimentFromCloud(id);
      alert("✅ Ensayo eliminado correctamente de la base de datos en la nube.");
      await handleLoadCloudExperiments();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message || err}`);
    }
  };

  // Load drive folders and master logs on boot if already authorized
  useEffect(() => {
    if (googleToken) {
      handleLoadWorkspaceData(googleToken, rootFolderId, masterSheetId);
    }
  }, [googleToken, rootFolderId, masterSheetId]);

  const handleLoadWorkspaceData = async (token: string, folderId?: string, sheetId?: string) => {
    const activeRoot = folderId || rootFolderId;
    const activeSheet = sheetId || masterSheetId;

    try {
      // 1. Try listing Drive subfolders (with grace if fails)
      try {
        const folders = await listDriveSubfolders(token, activeRoot);
        setDriveFolders(folders);
      } catch (errFolders: any) {
        console.warn("No se pudo listar subcarpetas de Google Drive:", errFolders);
        // Fall back to general 'root' to see if that works
        if (activeRoot !== "root") {
          try {
            const foldersRoot = await listDriveSubfolders(token, "root");
            setDriveFolders(foldersRoot);
          } catch (_) {
            setDriveFolders([]);
          }
        } else {
          setDriveFolders([]);
        }
      }
      
      // 2. Try reading spreadsheet logs (with grace if fails)
      try {
        const logs = await readMasterSheetLogs(token, activeSheet);
        setMasterLogs(logs);
      } catch (errLogs) {
        console.warn("No se pudo leer la Planilla Maestra de Google Sheets:", errLogs);
        setMasterLogs([]);
      }
    } catch (err) {
      console.error("Error al cargar datos de Google Workspace:", err);
    }
  };

  // Trigger Google Sign-In pop-up
  const handleGoogleAuth = async () => {
    try {
      const token = await authorizeGoogleWorkspace();
      setGoogleToken(token);
      localStorage.setItem("fda_google_access_token", token);
      await handleLoadWorkspaceData(token);
      alert("✅ Conectado exitosamente con Google Workspace!");
    } catch (err: any) {
      alert(`⚠️ Error de autenticación Google: ${err.message || err}\n\nNota: Si tu navegador bloqueó la ventana emergente de inicio de sesión, puedes usar el "Plan B" (Token Manual) abajo para conectarte de forma instantánea.`);
    }
  };

  const handleManualToken = async (token: string) => {
    if (!token.trim()) return;
    try {
      setGoogleToken(token.trim());
      localStorage.setItem("fda_google_access_token", token.trim());
      await handleLoadWorkspaceData(token.trim());
      alert("✅ Token de acceso manual aplicado y guardado con éxito!");
    } catch (err: any) {
      alert(`⚠️ Error al cargar datos con el token manual: ${err.message || err}`);
    }
  };

  const handleGoogleDisconnect = () => {
    setGoogleToken(null);
    localStorage.removeItem("fda_google_access_token");
    setDriveFolders([]);
    setDriveImages([]);
    setSelectedFolderId("");
    setMasterLogs([]);
    setKineticsProcessed(false);
  };

  // Sync / Fetch Images from selected Drive folder
  const handleSyncDriveFolder = async (folderId: string) => {
    if (!googleToken) return;
    setIsSyncingDrive(true);
    try {
      const images = await listFolderImages(googleToken, folderId);
      // Sort chronologically by file name or date
      images.sort((a, b) => a.name.localeCompare(b.name));
      
      setDriveImages(images);
      setSelectedFolderId(folderId);

      // Map to camera config state
      handleCameraChange({
        uploadedPhotos: images.map(img => img.name),
        blancoPhotoName: images[0]?.name || "",
        driveLink: `https://drive.google.com/drive/folders/${folderId}`,
        contrastOk: true,
        backgroundOk: true,
        spacingOk: true
      });

      alert(`✅ Sincronizadas ${images.length} fotos reales de Google Drive para el análisis.`);
    } catch (err: any) {
      alert(`Error al sincronizar imágenes de Drive: ${err.message || err}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Run Optics Calibration (Savitzky-Golay in Y and X) on T0 image
  const handleRunOpticsCalibration = async () => {
    if (!googleToken) {
      alert("Por favor, conecte su Google Workspace en el Módulo 1.");
      return;
    }
    if (driveImages.length === 0) {
      alert("No hay imágenes de Google Drive cargadas en el Módulo 3.");
      return;
    }

    setIsCalibratingROI(true);
    try {
      const t0Image = driveImages[0];
      const blobUrl = await downloadDriveImageBlob(googleToken, t0Image.id);
      
      const rotationAngle = camera.rotationAngle || 180;
      const canvas = await drawImageToCanvas(blobUrl, rotationAngle);
      
      const result = calibrateOpticsT0(
        canvas,
        roi.sgVentanaY || 1.5,
        roi.sgVentanaX || 1.5,
        roi.sgPolinomio || 4,
        0.20 // Safety padding margin
      );

      setCalibrationResult(result);
      setCalibrationImageUrl(blobUrl);

      // Trigger standard calibration callback
      alert(`✅ Calibración de Máscara Óptica Completada!\n\nSe detectó la franja de tubos en Y (Central: ${result.yCentral}px) y los centros de los 8 tubos por Savitzky-Golay.`);
    } catch (err: any) {
      alert(`Error en Calibración Óptica: ${err.message || err}`);
    } finally {
      setIsCalibratingROI(false);
    }
  };

  // Run full temporal pixel extraction pipeline on all folder images
  const handleRunKineticsAnalysis = async () => {
    if (!googleToken) {
      alert("Conecte su Google Workspace primero.");
      return;
    }
    if (driveImages.length === 0) {
      alert("No hay imágenes cargadas.");
      return;
    }
    if (!calibrationResult) {
      alert("Primero debe ejecutar la calibración óptica en el Módulo 4.");
      return;
    }

    setIsAnalyzingKinetics(true);
    setAnalysisProgress(0);
    try {
      const N = driveImages.length;
      const rawGreenMat: number[][] = Array.from({ length: 8 }, () => new Array(N).fill(0));
      const rawBlueMat: number[][] = Array.from({ length: 8 }, () => new Array(N).fill(0));

      const subPadding = roi.subRoiPadding || 15;
      const rotationAngle = camera.rotationAngle || 180;

      // Extract raw times from file metadata or index-based timestamps
      const parsedTimes: { id: string; name: string; dt: Date }[] = [];
      const patron = /(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/;

      for (let i = 0; i < N; i++) {
        const file = driveImages[i];
        let dt = new Date(file.createdTime);
        const match = patron.exec(file.name);
        if (match) {
          const parts = match[1].split("_");
          const dateParts = parts[0].split("-");
          const timeParts = parts[1].split("-");
          dt = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
          );
        }
        parsedTimes.push({ id: file.id, name: file.name, dt });
      }

      const t0_dt = parsedTimes[0].dt;
      const t_rel_min = parsedTimes.map(item => (item.dt.getTime() - t0_dt.getTime()) / 60000);

      for (let i = 0; i < N; i++) {
        const item = parsedTimes[i];
        setCurrentFrameName(item.name);
        setAnalysisProgress(Math.round(((i + 1) / N) * 100));

        // Download and render to offscreen canvas
        const blobUrl = await downloadDriveImageBlob(googleToken, item.id);
        const canvas = await drawImageToCanvas(blobUrl, rotationAngle);
        
        // Extract real RGB averages
        const extracted = extractRealKinetics(canvas, calibrationResult.rois, subPadding);
        for (let tube = 0; tube < 8; tube++) {
          rawGreenMat[tube][i] = extracted[tube].green;
          rawBlueMat[tube][i] = extracted[tube].blue;
        }

        URL.revokeObjectURL(blobUrl);
      }

      // Linear interpolation to fit standard 61-point timeline (0 to 60 minutes)
      setSamples(prev => prev.map((sample, tubeIdx) => {
        const interpolatedGreen = new Array(61).fill(0);
        const interpolatedBlue = new Array(61).fill(0);

        for (let t = 0; t <= 60; t++) {
          if (t <= t_rel_min[0]) {
            interpolatedGreen[t] = rawGreenMat[tubeIdx][0];
            interpolatedBlue[t] = rawBlueMat[tubeIdx][0];
          } else if (t >= t_rel_min[N - 1]) {
            interpolatedGreen[t] = rawGreenMat[tubeIdx][N - 1];
            interpolatedBlue[t] = rawBlueMat[tubeIdx][N - 1];
          } else {
            let j = 0;
            while (j < N - 1 && t_rel_min[j + 1] < t) {
              j++;
            }
            const tA = t_rel_min[j];
            const tB = t_rel_min[j + 1];
            const valA_g = rawGreenMat[tubeIdx][j];
            const valB_g = rawGreenMat[tubeIdx][j + 1];
            const valA_b = rawBlueMat[tubeIdx][j];
            const valB_b = rawBlueMat[tubeIdx][j + 1];

            const ratio = (t - tA) / (tB - tA);
            interpolatedGreen[t] = valA_g + (valB_g - valA_g) * ratio;
            interpolatedBlue[t] = valA_b + (valB_b - valA_b) * ratio;
          }
        }

        return {
          ...sample,
          rawIntensities: interpolatedGreen.map(v => parseFloat(v.toFixed(2))),
          rawBlueIntensities: interpolatedBlue.map(v => parseFloat(v.toFixed(2)))
        };
      }));

      setKineticsProcessed(true);
      alert(`🎉 Procesamiento temporal completo!\n\nSe extrajeron las intensidades de los píxeles reales de las ${N} imágenes y se reconstruyó la cinética química.`);
    } catch (err: any) {
      alert(`Error al procesar lote fotométrico: ${err.message || err}`);
    } finally {
      setIsAnalyzingKinetics(false);
      setAnalysisProgress(0);
      setCurrentFrameName("");
    }
  };

  // Sync calculated kinetics directly to Google Sheets
  const handleSyncToGoogleSheets = async () => {
    if (!googleToken) {
      alert("Por favor, conecte su cuenta en la pestaña 1.");
      return;
    }
    if (!kineticsProcessed) {
      alert("Por favor, procese primero el lote de imágenes secuenciales en el Módulo 5.");
      return;
    }

    try {
      // 1. Build Headers
      const headers = ["Archivo", "Tiempo_Min"];
      samples.forEach((sample) => {
        headers.push(`${sample.name}_G_Neto`);
        headers.push(`${sample.name}_B_Crudo`);
        headers.push(`${sample.name}_Masa_g`);
      });

      // 2. Build rows (0 to 60 minutes)
      const rows: any[][] = [];
      const blankSample = samples.find(s => s.isBlank);

      for (let t = 0; t <= 60; t++) {
        const timeLabel = driveImages[Math.min(driveImages.length - 1, Math.floor(t * (driveImages.length / 61)))]?.name || `REACCION_T${t}m00s.png`;
        const row = [timeLabel, t];

        samples.forEach((sample) => {
          let netGreen = sample.rawIntensities[t] || 0;
          if (kinetics.normalizarBlanco) {
            if (sample.isBlank) {
              netGreen = 0;
            } else if (blankSample) {
              netGreen = Math.max(0, netGreen - (blankSample.rawIntensities[t] || 0));
            } else {
              netGreen = Math.max(0, netGreen - (sample.rawIntensities[0] || 0));
            }
          }

          if (kinetics.normalizarMasa && !sample.isPositiveControl && !sample.isBlank) {
            if (sample.mass > 0) {
              netGreen = (netGreen / sample.mass) * 0.5;
            }
          }

          const rawBlue = sample.rawBlueIntensities?.[t] || 0;
          row.push(parseFloat(netGreen.toFixed(2)));
          row.push(parseFloat(rawBlue.toFixed(2)));
          row.push(sample.mass);
        });

        rows.push(row);
      }

      // Write to individual sheets
      await writeKineticsToSpreadsheet(googleToken, expSheetId, headers, rows);

      // Append row to Master Log spreadsheet
      // Formula: find max slope for soils
      const v0_list: string[] = [];
      samples.forEach(sample => {
        // Find max difference between consecutive steps
        let maxSlope = 0;
        for (let t = 1; t <= 60; t++) {
          const diff = (sample.rawIntensities[t] || 0) - (sample.rawIntensities[t - 1] || 0);
          if (diff > maxSlope) maxSlope = diff;
        }
        v0_list.push(`${sample.name}: ${maxSlope.toFixed(2)}`);
      });

      const masterRow = [
        new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
        metadata.operador || "Analista FIUNER",
        driveImages[0]?.name || "N/A",
        driveImages.length,
        "60 min",
        v0_list.join(", ")
      ];

      await appendSummaryToMasterSheet(googleToken, masterSheetId, masterRow);
      
      // Refresh Master logs in table
      const updatedLogs = await readMasterSheetLogs(googleToken, masterSheetId);
      setMasterLogs(updatedLogs);

      alert("✅ Datos cinéticos y resumen de actividad guardados físicamente en sus planillas de Google Sheets!");
    } catch (err: any) {
      alert(`Error al sincronizar con Google Sheets: ${err.message || err}`);
    }
  };

  // Regenerate Session ID
  const regenerateSessionId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const formatted = `EXP-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
    setMetadata(prev => ({
      ...prev,
      idSesion: formatted
    }));
  };

  // State handlers
  const handleMetadataChange = (data: Partial<ExperimentMetadata>) => {
    setMetadata(prev => ({ ...prev, ...data }));
  };

  const handlePrepChange = (data: Partial<SoilPrep>) => {
    setPrep(prev => ({ ...prev, ...data }));
  };

  const handleCameraChange = (data: Partial<CameraConfig>) => {
    setCamera(prev => ({ ...prev, ...data }));
  };

  const handleRoiChange = (data: Partial<RoiConfig>) => {
    setRoi(prev => ({ ...prev, ...data }));
  };

  const handleKineticsChange = (data: Partial<KineticsConfig>) => {
    setKinetics(prev => ({ ...prev, ...data }));
  };

  const handleSampleChange = (id: number, data: Partial<SampleData>) => {
    setSamples(prev => prev.map(sample => sample.id === id ? { ...sample, ...data } : sample));
  };

  const handleCreateNewFolder = async (folderName: string) => {
    if (!googleToken) {
      alert("Primero debe conectar su cuenta de Google Workspace.");
      return;
    }
    try {
      const newId = await createDriveSubfolder(googleToken, "root", folderName);
      localStorage.setItem("fda_root_folder_id", newId);
      setRootFolderId(newId);
      alert(`✅ Carpeta de ensayos "${folderName}" creada correctamente en tu Google Drive.\nID: ${newId}`);
    } catch (err: any) {
      alert(`⚠️ Error al crear la carpeta en Drive: ${err.message || err}`);
    }
  };

  const handleCreateNewMasterSheet = async (title: string) => {
    if (!googleToken) {
      alert("Primero debe conectar su cuenta de Google Workspace.");
      return;
    }
    try {
      const newId = await createGoogleSpreadsheet(googleToken, title);
      localStorage.setItem("fda_master_sheet_id", newId);
      setMasterSheetId(newId);
      alert(`✅ Planilla Maestra "${title}" creada correctamente en tu Google Drive.\nID: ${newId}`);
    } catch (err: any) {
      alert(`⚠️ Error al crear la planilla maestra: ${err.message || err}`);
    }
  };

  const handleCreateNewExpSheet = async (title: string) => {
    if (!googleToken) {
      alert("Primero debe conectar su cuenta de Google Workspace.");
      return;
    }
    try {
      const newId = await createGoogleSpreadsheet(googleToken, title);
      localStorage.setItem("fda_exp_sheet_id", newId);
      setExpSheetId(newId);
      alert(`✅ Planilla de Ensayos "${title}" creada correctamente en tu Google Drive.\nID: ${newId}`);
    } catch (err: any) {
      alert(`⚠️ Error al crear la planilla de ensayos: ${err.message || err}`);
    }
  };

  const handleResetWorkspaceConfig = () => {
    localStorage.removeItem("fda_root_folder_id");
    localStorage.removeItem("fda_master_sheet_id");
    localStorage.removeItem("fda_exp_sheet_id");
    setRootFolderId(DEFAULT_ROOT_FOLDER_ID);
    setMasterSheetId(DEFAULT_MASTER_SHEET_ID);
    setExpSheetId(DEFAULT_EXP_SHEET_ID);
    alert("✅ Configuración de carpetas y planillas restablecida a los valores predeterminados de LaSBI.");
  };

  // Navigation Tabs Definition
  const tabs = [
    { 
      label: "📋 1. Registro & Ensayo", 
      icon: ClipboardList, 
      component: (
        <Tab1Registro 
          metadata={metadata} 
          onChange={handleMetadataChange} 
          accessToken={googleToken}
          onAuthorize={handleGoogleAuth}
          onDisconnect={handleGoogleDisconnect}
          onManualToken={handleManualToken}
          masterLogs={masterLogs}
          cloudExperiments={cloudExperiments}
          onSaveToCloud={handleSaveToCloud}
          onLoadFromCloud={handleLoadFromCloud}
          onDeleteFromCloud={handleDeleteFromCloud}
          isSavingToCloud={isSavingToCloud}
          isLoadingCloud={isLoadingCloud}
          rootFolderId={rootFolderId}
          masterSheetId={masterSheetId}
          expSheetId={expSheetId}
          onChangeRootFolder={setRootFolderId}
          onChangeMasterSheet={setMasterSheetId}
          onChangeExpSheet={setExpSheetId}
          onCreateFolder={handleCreateNewFolder}
          onCreateMasterSheet={handleCreateNewMasterSheet}
          onCreateExpSheet={handleCreateNewExpSheet}
          onResetConfig={handleResetWorkspaceConfig}
        />
      ) 
    },
    { 
      label: "🌱 2. Preprocesamiento Suelo", 
      icon: Sprout, 
      component: (
        <Tab2Preprocesamiento 
          prep={prep} 
          onChange={handlePrepChange} 
        />
      ) 
    },
    { 
      label: "📸 3. Captura & Cámara", 
      icon: CameraIcon, 
      component: (
        <Tab3Camera 
          config={camera} 
          onChange={handleCameraChange} 
          accessToken={googleToken}
          driveFolders={driveFolders}
          driveImages={driveImages}
          onSyncFolder={handleSyncDriveFolder}
          isSyncingDrive={isSyncingDrive}
        />
      ) 
    },
    { 
      label: "🎯 4. Segmentación ROIs", 
      icon: Target, 
      component: (
        <Tab4ROI 
          config={roi} 
          samples={samples} 
          onConfigChange={handleRoiChange} 
          onSampleChange={handleSampleChange} 
          accessToken={googleToken}
          driveImages={driveImages}
          onRunCalibration={handleRunOpticsCalibration}
          isCalibrating={isCalibratingROI}
          calibrationResult={calibrationResult}
          imageUrl={calibrationImageUrl}
        />
      ) 
    },
    { 
      label: "📈 5. Cinética & Derivadas", 
      icon: Activity, 
      component: (
        <Tab5Kinetics 
          config={kinetics} 
          samples={samples} 
          onChange={handleKineticsChange} 
          accessToken={googleToken}
          driveImages={driveImages}
          onRunKinetics={handleRunKineticsAnalysis}
          isAnalyzing={isAnalyzingKinetics}
          progress={analysisProgress}
          currentFrame={currentFrameName}
          onSyncToSheets={handleSyncToGoogleSheets}
          kineticsProcessed={kineticsProcessed}
        />
      ) 
    },
    { 
      label: "📄 6. Exportar & PDF", 
      icon: FileDown, 
      component: (
        <Tab6Export 
          metadata={metadata} 
          prep={prep} 
          camera={camera} 
          roi={roi} 
          kinetics={kinetics} 
          samples={samples} 
        />
      ) 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-container">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-8 shadow-sm print:hidden" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-2 rounded-lg text-white shadow-sm shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Sistema FDA v4 <span className="text-sky-600 font-extrabold">Real-Work</span>
                </h1>
                {googleToken ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 animate-pulse" />
                    Google Conectado
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Modo Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Plataforma de Análisis Enzimático de Suelos (FIUNER - Laboratorio de Suelos)
              </p>
            </div>
          </div>

          {/* Session Telemetry */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 text-xs font-medium">
            <div className="space-y-0.5">
              <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">ID de Sesión Activa</span>
              <span className="text-sky-700 font-mono font-bold block text-sm">{metadata.idSesion}</span>
            </div>
            <button
              type="button"
              onClick={regenerateSessionId}
              title="Regenerar ID de Sesión"
              className="p-1.5 hover:bg-sky-100 text-sky-600 hover:text-sky-900 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation and Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden" id="tab-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex overflow-x-auto no-scrollbar gap-1">
            <nav className="flex space-x-1" aria-label="Tabs">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all rounded-md ${
                      isActive 
                        ? "bg-sky-600 text-white shadow-md font-bold" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="main-content">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm print:border-none print:shadow-none print:p-0">
          {tabs[activeTab].component}
        </div>
      </main>

      {/* Status Bar / Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-3 px-6 text-center text-[10px] text-slate-500 font-medium print:hidden" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            © 2026 Plataforma de Análisis FDA • FIUNER • Edición Producción Sin Simulación
          </span>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              Google API Activa: Hojas de cálculo sincronizadas
            </span>
            <span className="text-sky-600 font-bold">
              Laboratorio BioSuelos FIUNER
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
