/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ExperimentMetadata } from "../types";
import { SavedExperiment } from "../utils/firebaseDb";
import { 
  User, 
  Beaker, 
  Database, 
  Search, 
  FileSpreadsheet, 
  Globe, 
  Lock, 
  Key, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  FolderOpen,
  ClipboardList,
  Fingerprint,
  Cloud,
  CloudUpload,
  Trash2,
  ArrowUpRight,
  Settings
} from "lucide-react";

interface Tab1RegistroProps {
  metadata: ExperimentMetadata;
  onChange: (data: Partial<ExperimentMetadata>) => void;
  accessToken: string | null;
  onAuthorize: () => void;
  onDisconnect: () => void;
  onManualToken: (token: string) => void;
  masterLogs: any[][];
  cloudExperiments: SavedExperiment[];
  onSaveToCloud: () => Promise<void>;
  onLoadFromCloud: (exp: SavedExperiment) => void;
  onDeleteFromCloud: (id: string) => Promise<void>;
  isSavingToCloud: boolean;
  isLoadingCloud: boolean;
  rootFolderId: string;
  masterSheetId: string;
  expSheetId: string;
  onChangeRootFolder: (id: string) => void;
  onChangeMasterSheet: (id: string) => void;
  onChangeExpSheet: (id: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onCreateMasterSheet: (title: string) => Promise<void>;
  onCreateExpSheet: (title: string) => Promise<void>;
  onResetConfig: () => void;
}

export default function Tab1Registro({
  metadata,
  onChange,
  accessToken,
  onAuthorize,
  onDisconnect,
  onManualToken,
  masterLogs,
  cloudExperiments,
  onSaveToCloud,
  onLoadFromCloud,
  onDeleteFromCloud,
  isSavingToCloud,
  isLoadingCloud,
  rootFolderId,
  masterSheetId,
  expSheetId,
  onChangeRootFolder,
  onChangeMasterSheet,
  onChangeExpSheet,
  onCreateFolder,
  onCreateMasterSheet,
  onCreateExpSheet,
  onResetConfig
}: Tab1RegistroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  
  // Manual Token States
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualTokenVal, setManualTokenVal] = useState("");

  const handleApplyManualToken = () => {
    if (!manualTokenVal.trim()) {
      alert("Por favor introduce un token válido.");
      return;
    }
    onManualToken(manualTokenVal.trim());
    setManualTokenVal("");
    setShowManualToken(false);
  };

  // Parse Master Logs
  const headers = masterLogs && masterLogs.length > 0 ? masterLogs[0] : [
    "Fecha/Hora", "Operador", "ID de Carpeta/Lote", "Total Fotos", "Duración", "Parámetros (v₀)"
  ];

  const rows = masterLogs && masterLogs.length > 1 ? masterLogs.slice(1) : [
    ["2026-08-11 15:30:22", "Dra. Elena Rostova", "Ensayo_Humedal_Sector_B", "15", "60 min", "T1: 2.15, T2: 1.88, T3: 0.12 (Blanco: 0.02)"],
    ["2026-08-12 10:14:50", "Ing. Matías Silva", "Suelo_Trigo_Rotacion", "18", "60 min", "T1: 2.85, T2: 2.10, T3: 0.15 (Blanco: 0.01)"]
  ];

  const filteredRows = rows.filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return row.some(cell => String(cell).toLowerCase().includes(term));
  });

  return (
    <div className="space-y-8 animate-fadeIn" id="tab1-registro-view">
      
      {/* 1. SECCIÓN: GESTIÓN DE USUARIO Y EXPERIMENTO ACTUAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Perfil del Operador / Gestión de Usuario */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Gestión de Usuario & Investigador Activo
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-700">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operador de Turno</span>
                <span className="text-xs font-bold text-slate-800 block truncate">{metadata.operador || "No Registrado"}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Rol: Investigador LaSBI / FIUNER</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="input-operador" className="text-xs font-semibold text-slate-700 block">Nombre del Investigador</label>
                <input
                  id="input-operador"
                  type="text"
                  placeholder="Ej: Dra. Elena Rostova"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  value={metadata.operador}
                  onChange={(e) => onChange({ operador: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="select-rol" className="text-xs font-semibold text-slate-700 block">Cargo / Área Científica</label>
                <select
                  id="select-rol"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-medium"
                >
                  <option value="lasbi">LaSBI - Laboratorio de Señales y Biosistemas</option>
                  <option value="quimica">FIUNER - Cátedra de Química Orgánica y Biológica</option>
                  <option value="externo">Investigador Externo / CONICET</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Parámetros del Ensayo Actual */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Beaker className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Gestión del Ensayo Actual
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="input-nombre-exp" className="text-xs font-semibold text-slate-700 block">Identificador del Ensayo</label>
              <input
                id="input-nombre-exp"
                type="text"
                placeholder="Ej: Ensayo_Suelo_FIUNER_2026"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                value={metadata.nombreExp}
                onChange={(e) => onChange({ nombreExp: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-id-sesion" className="text-xs font-semibold text-slate-700 block">ID de Sesión (Código Único)</label>
              <input
                id="input-id-sesion"
                type="text"
                placeholder="Ej: FDA-2026-X1"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                value={metadata.idSesion}
                onChange={(e) => onChange({ idSesion: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="select-seq" className="text-xs font-semibold text-slate-700 block">Secuencia Metodológica</label>
              <select
                id="select-seq"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-medium"
                value={metadata.seqMetodologica}
                onChange={(e) => onChange({ seqMetodologica: e.target.value as any })}
              >
                <option value="Reacción con FDA pre-incubado">Reacción con FDA pre-incubado (Método Estándar)</option>
                <option value="Reacción con tierra sola">Reacción con tierra sola (Control de Autofluorescencia)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-fecha" className="text-xs font-semibold text-slate-700 block">Fecha del Ensayo</label>
              <input
                id="input-fecha"
                type="date"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium font-mono"
                defaultValue={new Date().toISOString().substring(0, 10)}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 2. SECCIÓN: CONEXIÓN GOOGLE DRIVE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sincronización con Nube de LaSBI</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Acceda de forma directa al gabinete óptico e histórico de planillas.</p>
            </div>
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            {accessToken ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="bg-red-550 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm hover:bg-red-600"
              >
                Desconectar Cuenta
              </button>
            ) : (
              <button
                type="button"
                onClick={onAuthorize}
                className="bg-sky-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-sky-700"
              >
                <Key className="w-3.5 h-3.5" />
                Conectar Google Workspace
              </button>
            )}
          </div>
        </div>

        {accessToken ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>¡Conexión Activa con Google Workspace!</strong> Sus credenciales están cargadas en el navegador de manera segura. El analizador de suelo tiene acceso para consultar las carpetas biológicas del gabinete y escribir resultados en <code>FDA_Master_Database</code>.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-sky-950 block">Modo Sin Conexión</span>
                <span className="text-sky-700 block mt-0.5 leading-normal">
                  Para consultar la base de datos de experimentos históricos de forma directa, sincronice su correo institucional de la UNER o del CONICET utilizando el botón superior.
                </span>
              </div>
            </div>

            {/* Alternativa de Token de Acceso Manual */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <button
                type="button"
                onClick={() => setShowManualToken(!showManualToken)}
                className="text-[10px] text-slate-500 hover:text-sky-600 transition-colors font-bold flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <Key className="w-3 h-3 text-sky-650" />
                {showManualToken ? "Ocultar opción de Token de Acceso" : "¿La ventana emergente se bloquea? Usar Token de Acceso Manual (Plan B)"}
              </button>
              
              {showManualToken && (
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Si tu navegador bloquea las popups de Google, puedes pegar un <strong>Access Token</strong> temporal de Google Workspace (por ejemplo, generado desde Google OAuth Playground con los alcances de Drive y Sheets):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Pegar token aquí (comienza con ya29...)"
                      value={manualTokenVal}
                      onChange={(e) => setManualTokenVal(e.target.value)}
                      className="flex-1 text-[11px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyManualToken}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel de Ajustes Avanzados de Drive / Sheets (Siempre Visible) */}
        <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-white space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Settings className="w-4 h-4 text-sky-600" />
            <span>Configuración de Almacenamiento en Google Drive & Sheets</span>
          </div>
          
          <p className="text-[10px] text-slate-500 leading-normal">
            Si has iniciado sesión con tu propia cuenta de Google, puedes definir tus propias carpetas e identificadores de planillas. 
            Usa los siguientes controles para personalizar o <strong>crear nuevos recursos de forma automática y directa</strong> en tu cuenta de Google Drive:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CARPETA DE IMÁGENES */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Carpeta de Ensayos</span>
                <span className="text-[9px] text-slate-500 leading-tight block">Subcarpeta de Drive donde buscar los lotes de fotos. Usa <strong>root</strong> para buscar en tu Drive principal.</span>
                <input
                  type="text"
                  value={rootFolderId}
                  onChange={(e) => onChangeRootFolder(e.target.value)}
                  className="w-full text-[10px] bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              {accessToken && (
                <button
                  type="button"
                  onClick={() => onCreateFolder("FDA_Ensayos_Gabinete")}
                  className="w-full bg-white hover:bg-sky-550 hover:text-white text-sky-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-sky-200 transition-all cursor-pointer shadow-sm"
                >
                  📁 Crear Carpeta en Drive
                </button>
              )}
            </div>

            {/* 2. PLANILLA MAESTRA */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Planilla Maestra (Log)</span>
                <span className="text-[9px] text-slate-500 leading-tight block">Identificador del Spreadsheet donde se guarda la bitácora consolidada de actividad.</span>
                <input
                  type="text"
                  value={masterSheetId}
                  onChange={(e) => onChangeMasterSheet(e.target.value)}
                  className="w-full text-[10px] bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              {accessToken && (
                <button
                  type="button"
                  onClick={() => onCreateMasterSheet("FDA_Bitacora_Maestra")}
                  className="w-full bg-white hover:bg-sky-550 hover:text-white text-sky-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-sky-200 transition-all cursor-pointer shadow-sm"
                >
                  📊 Crear Planilla Maestra
                </button>
              )}
            </div>

            {/* 3. PLANILLA DE ENSAYO ACTIVO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Planilla de Ensayo Actual</span>
                <span className="text-[9px] text-slate-500 leading-tight block">Identificador del Spreadsheet donde se exportan los datos de cinéticas (tiempos vs intensidades).</span>
                <input
                  type="text"
                  value={expSheetId}
                  onChange={(e) => onChangeExpSheet(e.target.value)}
                  className="w-full text-[10px] bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              {accessToken && (
                <button
                  type="button"
                  onClick={() => onCreateExpSheet("FDA_Curvas_Cinetica")}
                  className="w-full bg-white hover:bg-sky-550 hover:text-white text-sky-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-sky-200 transition-all cursor-pointer shadow-sm"
                >
                  📈 Crear Planilla de Curvas
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={onResetConfig}
              className="text-[9px] text-red-500 hover:text-red-700 font-bold underline cursor-pointer focus:outline-none"
            >
              Restablecer valores predeterminados del LaSBI
            </button>
          </div>
        </div>
      </div>

      {/* 2.5. SECCIÓN: BASE DE DATOS EN LA NUBE (FIRESTORE) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-600 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Base de Datos en la Nube (Cloud Firestore)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Persistencia duradera para almacenar, buscar y recuperar ensayos entre sesiones o dispositivos.</p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Firestore Conectado (Real)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel para guardar ensayo actual */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guardar Sesión Activa</span>
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg space-y-2">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Sesión</span>
                  <span className="text-slate-800 font-bold font-mono break-all">{metadata.idSesion || "Sin ID"}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Nombre del Ensayo</span>
                  <span className="text-slate-700 font-semibold truncate block">{metadata.nombreExp || "Sin Identificador"}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Operador</span>
                  <span className="text-slate-700 font-semibold truncate block">{metadata.operador || "No asignado"}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Al guardar, se respaldará toda la configuración del suelo, los parámetros de cámara, la calibración de canales (ROI) y las lecturas cinéticas calculadas para auditorías o análisis futuro.
              </p>
            </div>

            <button
              type="button"
              onClick={onSaveToCloud}
              disabled={isSavingToCloud}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" />
              {isSavingToCloud ? "Guardando..." : "Guardar Ensayo en la Nube"}
            </button>
          </div>

          {/* Listado de ensayos en Firestore */}
          <div className="lg:col-span-8 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registros Guardados en la Nube</span>
            
            {isLoadingCloud ? (
              <div className="border border-slate-200 rounded-xl p-8 bg-white flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Buscando ensayos en Firestore...</span>
              </div>
            ) : cloudExperiments.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[280px] overflow-y-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white z-10">
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Identificador / ID Sesión</th>
                      <th className="py-2 px-3">Operador</th>
                      <th className="py-2 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px] text-slate-700 font-medium">
                    {cloudExperiments.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                          {new Date(exp.createdAt || Date.now()).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 block truncate max-w-[200px]" title={exp.metadata.nombreExp}>
                            {exp.metadata.nombreExp}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[200px]">
                            {exp.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-600 truncate max-w-[120px]">
                          {exp.metadata.operador}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onLoadFromCloud(exp)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded border border-emerald-200 transition-all flex items-center gap-1"
                              title="Cargar sesión actual con este registro"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              Cargar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteFromCloud(exp.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold p-1 rounded border border-red-200 transition-all"
                              title="Eliminar de la nube"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 bg-white flex flex-col items-center justify-center text-center">
                <Cloud className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Sin Ensayos en la Nube</span>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                  Guarda tu ensayo actual para verlo aquí. Podrás recuperarlo en cualquier momento para revisiones científicas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: HISTORIAL DE ENSAYOS ANTERIORES (MASTER DATABASE LOGS) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Historial Consolidado de Ensayos Anteriores</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Base unificada de datos para auditorías de actividad bacteriana de suelo seco.</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por operador o lote..."
              className="w-full text-[11px] bg-white border border-slate-350 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">N°</th>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">{h}</th>
                  ))}
                  <th className="py-2.5 px-3 w-20 text-center">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 font-medium font-mono">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, rowIdx) => (
                    <tr 
                      key={rowIdx} 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        selectedLogIndex === rowIdx ? "bg-sky-50/40" : ""
                      }`}
                      onClick={() => setSelectedLogIndex(rowIdx)}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-bold">{rowIdx + 1}</td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="py-3 px-3 truncate max-w-xs">
                          {cellIdx === 1 ? <strong className="font-sans text-slate-800">{cell}</strong> : cell}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold py-1 px-2.5 rounded border border-sky-200 transition-all"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length + 2} className="py-8 text-center text-slate-400 italic font-sans">
                      No hay registros coincidentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedLogIndex !== null && filteredRows[selectedLogIndex] && (
          <div className="bg-white border border-sky-100 rounded-xl p-4 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold text-sky-900 border-b border-sky-50 pb-2">
              <ClipboardList className="w-4 h-4 text-sky-600" />
              Detalle del Experimento Seleccionado
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-slate-600 font-semibold leading-relaxed">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha/Hora</span>
                <span>{filteredRows[selectedLogIndex][0]}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador Responsable</span>
                <span>{filteredRows[selectedLogIndex][1]}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Lote de Fotos</span>
                <span>{filteredRows[selectedLogIndex][2]}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Fotogramas</span>
                <span>{filteredRows[selectedLogIndex][3]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Parámetros Reportados (G_neto Final / dG_dt)</span>
                <span className="font-mono text-emerald-700 font-bold">{filteredRows[selectedLogIndex][5]}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
