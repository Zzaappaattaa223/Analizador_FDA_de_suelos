/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CameraConfig } from "../types";
import { 
  Camera, 
  FolderOpen, 
  RefreshCw, 
  Sliders, 
  Lock, 
  CheckCircle2, 
  Globe, 
  Eye, 
  Image as ImageIcon,
  Clock,
  Sparkles,
  Beaker,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Folder,
  HelpCircle,
  FolderSymlink
} from "lucide-react";
import { listDriveSubfolders } from "../utils/googleService";

interface Tab3CameraProps {
  config: CameraConfig;
  onChange: (data: Partial<CameraConfig>) => void;
  accessToken: string | null;
  driveFolders: { id: string; name: string }[];
  driveImages: { id: string; name: string; createdTime?: string }[];
  onSyncFolder: (folderId: string) => Promise<void>;
  isSyncingDrive: boolean;
}

export default function Tab3Camera({
  config,
  onChange,
  accessToken,
  driveFolders,
  driveImages,
  onSyncFolder,
  isSyncingDrive
}: Tab3CameraProps) {
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFolderName, setSelectedFolderName] = useState("");

  // Directory Browser local states
  const [browsingFolderId, setBrowsingFolderId] = useState(() => localStorage.getItem("fda_root_folder_id") || "root");
  const [browsingFolders, setBrowsingFolders] = useState<{ id: string; name: string }[]>([]);
  const [historyStack, setHistoryStack] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "Mi Unidad" }
  ]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Synchronize dynamic browsing folders on token change or browsing ID change
  useEffect(() => {
    if (accessToken) {
      loadSubfolders(browsingFolderId);
    } else {
      setBrowsingFolders([]);
    }
  }, [browsingFolderId, accessToken]);

  const loadSubfolders = async (folderId: string) => {
    setIsLoadingFolders(true);
    try {
      const folders = await listDriveSubfolders(accessToken!, folderId);
      setBrowsingFolders(folders);
    } catch (err) {
      console.error("Error al navegar por carpetas de Google Drive:", err);
      setBrowsingFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleEnterFolder = (id: string, name: string) => {
    setHistoryStack(prev => [...prev, { id, name }]);
    setBrowsingFolderId(id);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    const newStack = historyStack.slice(0, index + 1);
    setHistoryStack(newStack);
    setBrowsingFolderId(newStack[newStack.length - 1].id);
  };

  const handleGoBack = () => {
    if (historyStack.length <= 1) return;
    const newStack = historyStack.slice(0, -1);
    setHistoryStack(newStack);
    setBrowsingFolderId(newStack[newStack.length - 1].id);
  };

  const handleSelectFolderAsLugar = (id: string, name: string) => {
    setSelectedFolderId(id);
    setSelectedFolderName(name);
    onSyncFolder(id);
  };

  const handleLoadSimulation = () => {
    const simPhotos = Array.from({ length: 12 }, (_, i) => ({
      id: `sim-photo-${i}`,
      name: i === 0 ? "BLANCO_T00m00s.png" : `REACCION_T${(i * 5).toString().padStart(2, "0")}m00s.png`,
      createdTime: new Date(Date.now() - (60 - i * 5) * 60 * 1000).toISOString()
    }));
    
    onChange({
      uploadedPhotos: simPhotos.map(p => p.name),
      blancoPhotoName: simPhotos[0].name,
      contrastOk: true,
      backgroundOk: true,
      spacingOk: true
    });

    // Injects directly into images list for offline preview
    driveImages.splice(0, driveImages.length, ...simPhotos);
    alert("✅ Se cargó un lote de 12 fotos simuladas de laboratorio para pruebas rápidas.");
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="tab3-camera-view">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Camera className="w-5 h-5 text-sky-600" />
          Módulo 3: Captura, Cámara & Origen de Datos
        </h2>
        <p className="text-xs text-slate-500">
          Explore sus carpetas de Google Drive de manera visual y seleccione el lugar exacto del ensayo para importar sus imágenes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Sincronización de Google Drive u Offline */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-sky-600" />
              Explorador de Google Drive (Real)
            </span>
            {accessToken && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Conectado
              </span>
            )}
          </div>

          {accessToken ? (
            <div className="space-y-4">
              
              {/* Breadcrumbs Path Navigation */}
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-1.5 flex-wrap text-xs">
                {historyStack.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <button
                      type="button"
                      onClick={() => handleNavigateToBreadcrumb(index)}
                      className={`font-semibold hover:text-sky-600 transition-colors cursor-pointer ${
                        index === historyStack.length - 1 ? "text-slate-900 font-bold" : "text-slate-500"
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Folder Browser Card List */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Carpetas en el Directorio Actual</span>
                  {historyStack.length > 1 && (
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer font-bold focus:outline-none"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Atrás
                    </button>
                  )}
                </div>

                <div className="p-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {isLoadingFolders ? (
                    <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                      <span>Cargando carpetas de Drive...</span>
                    </div>
                  ) : browsingFolders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                      <Folder className="w-8 h-8 text-slate-300 mx-auto" />
                      <span className="font-bold block">No hay subcarpetas</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Esta carpeta de Google Drive no contiene subcarpetas.</span>
                    </div>
                  ) : (
                    browsingFolders.map((folder) => {
                      const isActiveSelection = selectedFolderId === folder.id;
                      return (
                        <div
                          key={folder.id}
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-all rounded-lg ${
                            isActiveSelection ? "bg-sky-50 border border-sky-100" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate min-w-0 pr-2">
                            <Folder className={`w-5 h-5 shrink-0 ${isActiveSelection ? "text-sky-600" : "text-slate-400"}`} />
                            <div className="truncate text-left">
                              <span className="text-xs font-bold text-slate-800 truncate block">
                                {folder.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block truncate">
                                ID: {folder.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEnterFolder(folder.id, folder.name)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            >
                              ➡️ Entrar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectFolderAsLugar(folder.id, folder.name)}
                              className={`font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                                isActiveSelection
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-sky-600 hover:bg-sky-700 text-white"
                              }`}
                            >
                              {isActiveSelection ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Seleccionado
                                </>
                              ) : (
                                <>
                                  <FolderSymlink className="w-3.5 h-3.5" />
                                  Seleccionar Lugar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Selection Banner */}
              {selectedFolderId && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 leading-tight">
                      <span className="font-bold block">Ubicación de Fotos Seleccionada:</span>
                      <span className="text-emerald-700 block mt-0.5 font-bold">{selectedFolderName}</span>
                      <span className="text-[9px] text-emerald-600 block mt-0.5 font-mono">ID: {selectedFolderId}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSyncFolder(selectedFolderId)}
                    disabled={isSyncingDrive}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncingDrive ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Sincronizar Fotos
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 leading-normal">
                  <span className="font-bold block">Acceso de Google No Detectado</span>
                  <p className="mt-1">
                    Conecte su cuenta de Google en la primera pestaña para escanear las carpetas. O haga clic debajo para probar con datos simulados.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadSimulation}
                className="w-full bg-sky-50 hover:bg-sky-100 text-sky-750 border border-sky-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-sky-600 animate-bounce" />
                Cargar Secuencia de Fotos Simuladas (61 Minutos)
              </button>
            </div>
          )}

          {driveImages.length > 0 && (
            <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Fotos del Ensayo Cargadas ({driveImages.length})
              </span>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-150">
                {driveImages.map((img, idx) => (
                  <div key={img.id || idx} className="py-2 flex items-center justify-between text-xs font-mono font-medium text-slate-650">
                    <span className="flex items-center gap-1.5 truncate">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      {img.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold shrink-0">
                      T{idx * 5}'
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ajustes de Exposición y Filtros de la Cámara */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5 text-sky-600" />
              Parámetros de Captura Óptica (SmartPhone)
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="select-iso" className="text-xs font-bold text-slate-700 block">Sensibilidad ISO</label>
              <select
                id="select-iso"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-semibold"
                value={config.iso}
                onChange={(e) => onChange({ iso: e.target.value as any })}
              >
                <option value="200-400 (Recomendado)">ISO 200 - 400 (Recomendado)</option>
                <option value="800">ISO 800 (Alta dispersión de grano)</option>
                <option value="Automático">Automático (No recomendado - genera ruido)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="select-wb" className="text-xs font-bold text-slate-700 block">Balance de Blancos (WB)</label>
              <select
                id="select-wb"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-semibold"
                value={config.balanceBlancos}
                onChange={(e) => onChange({ balanceBlancos: e.target.value as any })}
              >
                <option value="5000 Kelvin (Recomendado)">5000 Kelvin (Fluorescencia nítida)</option>
                <option value="Automático">Automático (Genera viraje espectral)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="select-shutter" className="text-xs font-bold text-slate-700 block">Velocidad de Obturación</label>
              <select
                id="select-shutter"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-semibold"
                value={config.velocidadObturacion}
                onChange={(e) => onChange({ velocidadObturacion: e.target.value as any })}
              >
                <option value="1/10 a 1/15 (Recomendado)">1/10 a 1/15 s (Recomendado)</option>
                <option value="1/30">1/30 s</option>
                <option value="Automático">Automático</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="check-filter" className="text-xs font-bold text-slate-700 block">Filtro Físico de Excitación</label>
                <span className="text-[9px] text-slate-400 block mt-0.5">Filtro azul colocado delante de la lente de la cámara.</span>
              </div>
              <input
                id="check-filter"
                type="checkbox"
                className="w-4.5 h-4.5 accent-sky-600"
                checked={config.filtroFisicoColocado}
                onChange={(e) => onChange({ filtroFisicoColocado: e.target.checked })}
              />
            </div>

          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Aviso de Configuración del Smartphone</span>
              <p className="mt-1 leading-normal text-[11px] text-amber-800">
                Asegúrese de bloquear el enfoque (Focus Lock) y la exposición de luz antes de arrancar el ensayo para que la luminosidad relativa sea exactamente la misma en toda la curva cinética.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
