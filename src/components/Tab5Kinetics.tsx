/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KineticsConfig, SampleData } from "../types";
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  FileDown, 
  Settings, 
  Sliders, 
  Info, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface Tab5KineticsProps {
  config: KineticsConfig;
  samples: SampleData[];
  onChange: (data: Partial<KineticsConfig>) => void;
  accessToken: string | null;
  driveImages: { id: string; name: string }[];
  onRunKinetics: () => Promise<void>;
  isAnalyzing: boolean;
  progress: number;
  currentFrame: string;
  onSyncToSheets: () => Promise<void>;
  kineticsProcessed: boolean;
}

export default function Tab5Kinetics({
  config,
  samples,
  onChange,
  accessToken,
  driveImages,
  onRunKinetics,
  isAnalyzing,
  progress,
  currentFrame,
  onSyncToSheets,
  kineticsProcessed
}: Tab5KineticsProps) {
  const [activeChartTab, setActiveChartTab] = useState<"accumulation" | "derivative" | "g_b_ratio">("accumulation");

  const blankSample = samples.find(s => s.isBlank);

  const getProcessedIntensity = (sample: SampleData, t: number): number => {
    let val = sample.rawIntensities[t] || 0;
    if (config.normalizarBlanco) {
      if (sample.isBlank) {
        val = 0;
      } else if (blankSample) {
        val = Math.max(0, val - (blankSample.rawIntensities[t] || 0));
      } else {
        val = Math.max(0, val - (sample.rawIntensities[0] || 0));
      }
    }
    if (config.normalizarMasa && !sample.isPositiveControl && !sample.isBlank) {
      if (sample.mass > 0) {
        val = (val / sample.mass) * 0.5; // normalized to standard 0.5g
      }
    }
    return parseFloat(val.toFixed(1));
  };

  const getDerivative = (sample: SampleData, t: number): number => {
    if (t < config.sedimentationCutoff) return 0;
    if (t < 1) return 0;
    const current = getProcessedIntensity(sample, t);
    const prev = getProcessedIntensity(sample, t - 1);
    return parseFloat((current - prev).toFixed(2));
  };

  const getGBRatio = (sample: SampleData, t: number): number => {
    if (sample.rawBlueIntensities && sample.rawBlueIntensities[t] > 0) {
      const greenVal = sample.rawIntensities[t] || 0;
      const blueVal = sample.rawBlueIntensities[t] || 1;
      return parseFloat((greenVal / blueVal).toFixed(2));
    }
    const processedVal = getProcessedIntensity(sample, t);
    const baseline = 0.15;
    const factor = sample.isPositiveControl ? 0.045 : sample.isBlank ? 0.005 : 0.038;
    return parseFloat((baseline + processedVal * factor).toFixed(2));
  };

  // SVG Chart rendering settings
  const width = 600;
  const height = 250;
  const padding = { top: 15, right: 15, bottom: 30, left: 45 };

  const generateSvgPath = (sample: SampleData, graphType: "accumulation" | "derivative" | "g_b_ratio") => {
    const points: string[] = [];
    let maxVal = 250;
    if (graphType === "accumulation") {
      maxVal = config.normalizarMasa ? 320 : 250;
    } else if (graphType === "derivative") {
      maxVal = 6;
    } else {
      maxVal = 12;
    }

    for (let t = 0; t <= 60; t++) {
      let val = 0;
      if (graphType === "accumulation") {
        val = getProcessedIntensity(sample, t);
      } else if (graphType === "derivative") {
        val = getDerivative(sample, t);
      } else {
        val = getGBRatio(sample, t);
      }

      const x = padding.left + (t / 60) * (width - padding.left - padding.right);
      const valRatio = Math.min(1, Math.max(0, val / maxVal));
      const y = height - padding.bottom - valRatio * (height - padding.top - padding.bottom);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="tab5-kinetics-view">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Módulo 5: Cinética de Reacción & Procesamiento Espectral
        </h2>
        <p className="text-xs text-slate-500">
          Procese el lote completo de fotos en secuencia temporal y visualice la hidrólisis acumulativa de la diacetato de fluoresceína.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Trigger */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Parámetros de Normalización Cinética
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="check-norm-blanco" className="text-xs font-bold text-slate-700 block">Normalizar por Blanco (G_neto)</label>
                <span className="text-[10px] text-slate-400 block mt-0.5">Resta la autofluorescencia del canal blanco en cada minuto.</span>
              </div>
              <input
                id="check-norm-blanco"
                type="checkbox"
                className="w-4.5 h-4.5 accent-emerald-600"
                checked={config.normalizarBlanco}
                onChange={(e) => onChange({ normalizarBlanco: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="check-norm-masa" className="text-xs font-bold text-slate-700 block">Normalizar por Peso Seco</label>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ajusta la curva a la cantidad de gramos de suelo seco (0.5g std).</span>
              </div>
              <input
                id="check-norm-masa"
                type="checkbox"
                className="w-4.5 h-4.5 accent-emerald-600"
                checked={config.normalizarMasa}
                onChange={(e) => onChange({ normalizarMasa: e.target.checked })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-cutoff" className="text-xs font-semibold text-slate-700 block">Sedimentación Cutoff (minutos)</label>
              <input
                id="input-cutoff"
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-semibold"
                value={config.sedimentationCutoff}
                onChange={(e) => onChange({ sedimentationCutoff: parseInt(e.target.value) || 0 })}
              />
            </div>

          </div>

          <button
            type="button"
            onClick={onRunKinetics}
            disabled={isAnalyzing || driveImages.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando {progress}%...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                ▶️ Procesar Lote de Fotos
              </>
            )}
          </button>

          {isAnalyzing && (
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-sky-950">
                <span>Fotograma Actual:</span>
                <span className="font-mono">{currentFrame}</span>
              </div>
              <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-sky-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Graphs Output */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Gráfico Dinámico de Hidrólisis FDA
            </span>

            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveChartTab("accumulation")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                  activeChartTab === "accumulation" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-850"
                }`}
              >
                G_neto
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab("derivative")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                  activeChartTab === "derivative" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-850"
                }`}
              >
                dG/dt (Velocidad)
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab("g_b_ratio")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                  activeChartTab === "g_b_ratio" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-850"
                }`}
              >
                G/B Ratio
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-4 bg-white border border-slate-200 rounded-xl">
            <svg width={width} height={height}>
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                const y = padding.top + r * (height - padding.top - padding.bottom);
                return (
                  <line
                    key={idx}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                );
              })}
              {[0, 10, 20, 30, 40, 50, 60].map((t, idx) => {
                const x = padding.left + (t / 60) * (width - padding.left - padding.right);
                return (
                  <line
                    key={idx}
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Draw Curves */}
              {samples.map((s) => (
                <path
                  key={s.id}
                  d={generateSvgPath(s, activeChartTab)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.isPositiveControl ? "3" : "1.8"}
                  className="transition-all duration-300"
                />
              ))}

              {/* Axes */}
              <line
                x1={padding.left}
                y1={height - padding.bottom}
                x2={width - padding.right}
                y2={height - padding.bottom}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={height - padding.bottom}
                stroke="#64748b"
                strokeWidth="1.5"
              />

              {/* X Labels */}
              {[0, 10, 20, 30, 40, 50, 60].map((t, idx) => {
                const x = padding.left + (t / 60) * (width - padding.left - padding.right);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={height - 8}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {t}'
                  </text>
                );
              })}

              {/* Y Axis Label */}
              <text
                x={5}
                y={padding.top + 6}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {activeChartTab === "accumulation" ? (config.normalizarMasa ? "320 Max" : "250 Max") : activeChartTab === "derivative" ? "6 dG/dt" : "12 ratio"}
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full border-t border-slate-100 pt-4">
            {samples.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                <span className="truncate">Tubo {s.id}: {s.isPositiveControl ? "Ctrl +" : s.isBlank ? "Blanco" : `${s.mass}g soil`}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
