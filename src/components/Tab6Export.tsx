/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ExperimentMetadata, SoilPrep, CameraConfig, RoiConfig, KineticsConfig, SampleData } from "../types";
import { 
  FileText, 
  Printer, 
  FileDown, 
  TrendingUp, 
  CheckCircle2, 
  User, 
  Beaker, 
  Info,
  Calendar,
  Layers,
  Camera
} from "lucide-react";

interface Tab6ExportProps {
  metadata: ExperimentMetadata;
  prep: SoilPrep;
  camera: CameraConfig;
  roi: RoiConfig;
  kinetics: KineticsConfig;
  samples: SampleData[];
}

export default function Tab6Export({
  metadata,
  prep,
  camera,
  roi,
  kinetics,
  samples
}: Tab6ExportProps) {

  const blankSample = samples.find(s => s.isBlank);

  const getProcessedIntensity = (sample: SampleData, t: number): number => {
    let val = sample.rawIntensities[t] || 0;
    if (kinetics.normalizarBlanco) {
      if (sample.isBlank) {
        val = 0;
      } else if (blankSample) {
        val = Math.max(0, val - (blankSample.rawIntensities[t] || 0));
      } else {
        val = Math.max(0, val - (sample.rawIntensities[0] || 0));
      }
    }
    if (kinetics.normalizarMasa && !sample.isPositiveControl && !sample.isBlank) {
      if (sample.mass > 0) {
        val = (val / sample.mass) * 0.5; // normalized to standard 0.5g
      }
    }
    return parseFloat(val.toFixed(1));
  };

  const getFinalValue = (sample: SampleData) => {
    return getProcessedIntensity(sample, 60);
  };

  const getV0Slope = (sample: SampleData) => {
    // Delta G_neto between minuto 20 and cutoff (e.g. 15)
    const tStart = kinetics.sedimentationCutoff;
    const tEnd = 20;
    const gStart = getProcessedIntensity(sample, tStart);
    const gEnd = getProcessedIntensity(sample, tEnd);
    const dt = tEnd - tStart;
    if (dt <= 0) return 0;
    return parseFloat(((gEnd - gStart) / dt).toFixed(3));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [];
    // Headers
    const headers = ["Minuto", "Frame"];
    samples.forEach(s => {
      headers.push(`${s.name}_G_neto`);
      headers.push(`${s.name}_B_crudo`);
      headers.push(`${s.name}_Masa_g`);
    });
    csvRows.push(headers.join(","));

    for (let t = 0; t <= 60; t++) {
      const row = [t, `Frame_T${t}m.png`];
      samples.forEach(s => {
        row.push(getProcessedIntensity(s, t).toString());
        row.push((s.rawBlueIntensities?.[t] || 12).toString());
        row.push(s.mass.toString());
      });
      csvRows.push(row.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reporte_FDA_${metadata.idSesion}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="tab6-export-view">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Módulo 6: Generación de Reportes, Impresión & PDF
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Imprima el reporte completo de hidrólisis de FDA certificado por LaSBI o descargue los coeficientes cinéticos crudos.
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-350 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            Descargar CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Reporte (PDF)
          </button>
        </div>
      </div>

      {/* PRINTABLE DOSSIER CARD */}
      <div className="bg-white border border-slate-250 rounded-2xl p-8 space-y-8 shadow-sm max-w-4xl mx-auto" id="printable-dossier-card">
        
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b border-slate-250 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
              Analizador de Suelos FDA - Reporte de Ensayo
            </h1>
            <span className="text-[10px] font-bold text-sky-700 block tracking-wider uppercase font-mono">
              Laboratorio de Señales y Biosistemas (LaSBI) • FIUNER
            </span>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-400 font-bold">
            <div>ID SESIÓN: {metadata.idSesion || "PENDIENTE"}</div>
            <div>FECHA: {metadata.fecha || new Date().toISOString().substring(0, 10)}</div>
          </div>
        </div>

        {/* Executive Summary Matrices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Metadata Grid */}
          <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
              1. Identificación del Operador & Ensayo
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-650 font-semibold">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Operador Responsable</span>
                <span className="text-slate-800 font-bold">{metadata.operador || "No Definido"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Nombre de Ensayo</span>
                <span className="text-slate-800 font-bold">{metadata.nombreExp || "No Definido"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Secuencia Metodológica</span>
                <span className="text-slate-800 font-bold text-[11px]">{metadata.seqMetodologica}</span>
              </div>
            </div>
          </div>

          {/* Soil Preparation Grid */}
          <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
              2. Preprocesamiento Físico del Suelo
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-650 font-semibold">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Suelo Tamizado</span>
                <span className="text-slate-800 font-bold">{prep.tamizado ? `Sí (malla ${prep.aperturaMalla} mm)` : "No"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Humedad de Campo</span>
                <span className="text-slate-800 font-bold">{prep.humedadEstimada}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Proporción Suelo / Buffer</span>
                <span className="text-slate-800 font-bold">{prep.relacionSueloBuffer || "Sin dilución"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Calculated Coefficients Table (v0 Slope & Final G_neto) */}
        <div className="space-y-3.5">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
            3. Coeficientes de Actividad Enzimática (Hidrólisis FDA)
          </span>

          <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-16 text-center">Canal</th>
                  <th className="py-2.5 px-3.5">Descripción Muestra</th>
                  <th className="py-2.5 px-3.5 text-right w-24">Peso Seco (g)</th>
                  <th className="py-2.5 px-3.5 text-right w-36">Pendiente Inicial v₀</th>
                  <th className="py-2.5 px-3.5 text-right w-28">G_neto Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3.5 text-center font-bold text-slate-400">Tubo {s.id}</td>
                    <td className="py-3 px-3.5 font-sans font-bold text-slate-700">
                      {s.isPositiveControl ? (
                        <span className="text-sky-700 font-extrabold uppercase">Control Positivo</span>
                      ) : s.isBlank ? (
                        <span className="text-amber-700 font-extrabold uppercase">Blanco Metodológico</span>
                      ) : (
                        `Muestra de Suelo T${s.id}`
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-500">{s.isPositiveControl || s.isBlank ? "0.00" : s.mass.toFixed(2)}</td>
                    <td className="py-3 px-3.5 text-right font-extrabold text-emerald-700">{getV0Slope(s)} G_net/min</td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900">{getFinalValue(s).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Laboratory Signature area */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-250 pt-16">
          <div className="text-center space-y-1">
            <div className="w-48 border-b border-slate-300 mx-auto h-12"></div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Firma del Operador</span>
            <span className="text-xs text-slate-800 font-bold block">{metadata.operador || "Responsable"}</span>
          </div>

          <div className="text-center space-y-1">
            <div className="w-48 border-b border-slate-300 mx-auto h-12"></div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Firma del Supervisor (LaSBI)</span>
            <span className="text-xs text-slate-400 font-bold block">Supervisor Científico</span>
          </div>
        </div>

      </div>

    </div>
  );
}
