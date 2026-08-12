/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { RoiConfig, SampleData } from "../types";
import { 
  Target, 
  Sliders, 
  CheckCircle2, 
  RefreshCw, 
  Camera, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Info, 
  Sparkles,
  Beaker,
  AlertTriangle
} from "lucide-react";

interface Tab4ROIProps {
  config: RoiConfig;
  samples: SampleData[];
  onConfigChange: (data: Partial<RoiConfig>) => void;
  onSampleChange: (id: number, data: Partial<SampleData>) => void;
  accessToken: string | null;
  driveImages: { id: string; name: string }[];
  onRunCalibration: () => Promise<void>;
  isCalibrating: boolean;
  calibrationResult: any;
  imageUrl: string | null;
}

export default function Tab4ROI({
  config,
  samples,
  onConfigChange,
  onSampleChange,
  accessToken,
  driveImages,
  onRunCalibration,
  isCalibrating,
  calibrationResult,
  imageUrl
}: Tab4ROIProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const subRoiPadding = config.subRoiPadding ?? 15;

  // Mass change handler
  const handleMassChange = (id: number, massStr: string) => {
    const mass = parseFloat(massStr);
    onSampleChange(id, { mass: isNaN(mass) ? 0 : mass });
  };

  // Positive control selection
  const handlePositiveControlChange = (selectedTubo: string) => {
    onConfigChange({ tuboControlPositivo: selectedTubo });
    samples.forEach((sample) => {
      const isSelected = `Tubo ${sample.id}` === selectedTubo;
      onSampleChange(sample.id, { 
        isPositiveControl: isSelected,
        mass: isSelected ? 0 : sample.mass === 0 ? 0.50 : sample.mass
      });
    });
  };

  // Render physical image & detected ROIs onto canvas
  useEffect(() => {
    if (imageUrl && calibrationResult && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 400;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const paddingRatio = subRoiPadding / 100;
        calibrationResult.rois.forEach((r: any, idx: number) => {
          // Green bounding boxes for high contrast
          ctx.strokeStyle = "rgba(34, 197, 94, 0.95)"; // Emerald-500
          ctx.lineWidth = 4;
          ctx.strokeRect(r.x, r.y, r.w, r.h);

          // Celeste sub-ROI (safety area)
          const px = Math.round(r.w * paddingRatio);
          const py = Math.round(r.h * paddingRatio);
          ctx.strokeStyle = "rgba(14, 165, 233, 0.9)"; // Sky-500
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(r.x + px, r.y + py, r.w - px * 2, r.h - py * 2);
          ctx.setLineDash([]);

          // Draw Tube Labels
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fillRect(r.x, r.y - 25, 65, 22);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px monospace";
          ctx.fillText(`Tubo ${idx + 1}`, r.x + 6, r.y - 10);
        });
      };
      img.src = imageUrl;
    }
  }, [imageUrl, calibrationResult, subRoiPadding]);

  return (
    <div className="space-y-8 animate-fadeIn" id="tab4-roi-view">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-600" />
          Módulo 4: Segmentación de Canales (ROIs) & Calibración
        </h2>
        <p className="text-xs text-slate-500">
          Calibre ópticamente la máscara utilizando la primera foto (t₀) para alinear los 8 canales de reacción.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Physical image & ROIs */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-800">
                Máscara de Seguridad de los Canales de Reacción
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">La primera imagen es escaneada para fijar baricentros.</p>
            </div>
            
            {calibrationResult && (
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span>
                Alineado
              </span>
            )}
          </div>

          {imageUrl && calibrationResult ? (
            <div className="border border-slate-350 rounded-2xl overflow-hidden bg-slate-950 p-2 flex flex-col items-center justify-center relative shadow-inner">
              <div className="absolute inset-x-0 top-0 bg-slate-900/90 border-b border-slate-800 px-3 py-1 text-[8px] text-emerald-400 font-bold font-mono text-center tracking-widest z-10">
                GABINETE ÓPTICO LASBI - T0 DETECTADO
              </div>
              <div className="overflow-x-auto w-full flex justify-center py-4">
                <canvas 
                  ref={canvasRef} 
                  className="rounded-lg shadow-2xl max-w-full h-auto border border-slate-800 bg-black"
                  style={{ maxHeight: "300px" }}
                />
              </div>
              <p className="text-[9px] text-slate-400 italic text-center pb-1">
                *Líneas verdes = Canales de reacción • Línea discontinua celeste = Sub-ROI integrado libre de brillos.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl bg-slate-900 p-8 flex flex-col items-center justify-center text-center text-slate-400 h-64 relative">
              <Camera className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Aún no se ha ejecutado la Calibración Óptica</span>
              <p className="text-[10px] text-slate-550 max-w-xs mt-1 leading-relaxed">
                Haga clic en el botón "Ejecutar Calibración Óptica" inferior para extraer las coordenadas reales.
              </p>
            </div>
          )}

          {/* Calibrate Buttons & Controls */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRunCalibration}
              disabled={isCalibrating || driveImages.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow"
            >
              {isCalibrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calibrando baricentros...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Ejecutar Calibración T0
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-sky-600" />
              Parámetros Avanzados
            </button>
          </div>

          {showDiagnostics && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="range-subroi" className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Recorte de Sub-ROI ({subRoiPadding}%)
                  </label>
                  <input
                    id="range-subroi"
                    type="range"
                    min="5"
                    max="35"
                    step="5"
                    value={subRoiPadding}
                    onChange={(e) => onConfigChange({ subRoiPadding: parseInt(e.target.value) || 15 })}
                    className="w-full accent-sky-600"
                  />
                </div>
                <div>
                  <label htmlFor="range-sg" className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    SG Window Y ({config.sgVentanaY}%)
                  </label>
                  <input
                    id="range-sg"
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={config.sgVentanaY}
                    onChange={(e) => onConfigChange({ sgVentanaY: parseFloat(e.target.value) })}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Metadatos, control positivo y masas de suelo */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Parámetros de Selección */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-800 block">Configuración de Canal de Control</span>
            
            <div className="space-y-1">
              <label htmlFor="select-positivo-ctrl" className="text-xs font-semibold text-slate-700 block">Canal Control Positivo</label>
              <select
                id="select-positivo-ctrl"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none font-semibold"
                value={config.tuboControlPositivo}
                onChange={(e) => handlePositiveControlChange(e.target.value)}
              >
                {samples.map(s => (
                  <option key={s.id} value={`Tubo ${s.id}`}>
                    Tubo {s.id} ({s.isBlank ? "Blanco" : s.isPositiveControl ? "Control +" : "Canal Suelo"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Masas de Tierra por Tubo */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 space-y-4">
            <span className="text-xs font-bold text-slate-800 block">Masas de Suelo Seco (g) por Tubo</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Especifique el peso seco de cada muestra de suelo para poder corregir automáticamente por masa en la cinética.
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {samples.map((s) => (
                <div key={s.id} className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Tubo {s.id}</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={s.isPositiveControl || s.isBlank}
                    className="w-16 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-right font-bold focus:outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                    value={s.isPositiveControl || s.isBlank ? "0.00" : s.mass}
                    onChange={(e) => handleMassChange(s.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
