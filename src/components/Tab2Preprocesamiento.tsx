/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SoilPrep } from "../types";
import { 
  Sprout, 
  CheckCircle, 
  Info, 
  Thermometer, 
  CloudRain, 
  Layers, 
  Sliders, 
  ClipboardCheck,
  AlertCircle
} from "lucide-react";

interface Tab2PreprocesamientoProps {
  prep: SoilPrep;
  onChange: (data: Partial<SoilPrep>) => void;
}

export default function Tab2Preprocesamiento({
  prep,
  onChange
}: Tab2PreprocesamientoProps) {

  return (
    <div className="space-y-8 animate-fadeIn" id="tab2-preprocesamiento-view">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-600" />
          Módulo 2: Preprocesamiento Físico del Suelo
        </h2>
        <p className="text-xs text-slate-500">
          Configure las condiciones de tamizado, secado y humedad del suelo. Estos factores impactan de forma directa en la actividad de la diacetato de fluoresceína (FDA) hidrolasa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* 1. Tamizado de la Muestra */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Tamizado según Normas IRAM / ISO
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${prep.tamizado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {prep.tamizado ? "Tamizado Completo" : "Sin Tamizar"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="check-tamizado" className="text-xs font-bold text-slate-700 block">Suelo Tamizado</label>
                <span className="text-[10px] text-slate-400 block mt-0.5">Elimina piedras y restos vegetales del lote de reacción.</span>
              </div>
              <input
                id="check-tamizado"
                type="checkbox"
                className="w-4.5 h-4.5 accent-emerald-600"
                checked={prep.tamizado}
                onChange={(e) => onChange({ tamizado: e.target.checked })}
              />
            </div>

            {prep.tamizado && (
              <div className="space-y-1 animate-fadeIn">
                <label htmlFor="input-apertura" className="text-xs font-semibold text-slate-700 block">Apertura de la Malla del Tamiz (mm)</label>
                <input
                  id="input-apertura"
                  type="text"
                  placeholder="Ej: 2.0 mm (Estándar)"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  value={prep.aperturaMalla}
                  onChange={(e) => onChange({ aperturaMalla: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* 2. Humedad y Secado */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-emerald-600" />
                Humedad de Campo & Secado
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${prep.secadoPrevio ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {prep.secadoPrevio ? "Secado Activo" : "Humedad Natural"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="check-secado" className="text-xs font-bold text-slate-700 block">Secado Previo a 40°C</label>
                <span className="text-[10px] text-slate-400 block mt-0.5">Estabiliza la respiración microbiana para evitar picos de hidrólisis.</span>
              </div>
              <input
                id="check-secado"
                type="checkbox"
                className="w-4.5 h-4.5 accent-emerald-600"
                checked={prep.secadoPrevio}
                onChange={(e) => onChange({ secadoPrevio: e.target.checked })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="range-humedad" className="text-xs font-semibold text-slate-700">Porcentaje de Humedad Estimada (%)</label>
                <span className="text-xs font-bold font-mono text-emerald-700">{prep.humedadEstimada}%</span>
              </div>
              <input
                id="range-humedad"
                type="range"
                min="0"
                max="80"
                step="5"
                className="w-full accent-emerald-600"
                value={prep.humedadEstimada}
                onChange={(e) => onChange({ humedadEstimada: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* 3. Dilución y Buffer */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Relación Suelo / Buffer de Fosfato
              </span>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-relacion" className="text-xs font-semibold text-slate-700 block">Proporción de Dilución (Suelo:Buffer)</label>
              <input
                id="input-relacion"
                type="text"
                placeholder="Ej: 1:10 (1g suelo en 10mL buffer)"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                value={prep.relacionSueloBuffer}
                onChange={(e) => onChange({ relacionSueloBuffer: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Laboratory Best Practices & Protocols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 space-y-4 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              Guía de Buenas Prácticas de LaSBI
            </h3>

            <div className="space-y-3.5 text-xs text-emerald-850 leading-relaxed">
              <div className="flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Tamizado Obligatorio:</strong> Utilice siempre tamices de acero de 2.0 mm de apertura para homogeneizar la densidad del canal de reacción del gabinete óptico.
                </p>
              </div>

              <div className="flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Control de Humedad:</strong> Evite preprocesar muestras de lodo o suelos extremadamente secos de golpe. La rehidratación con buffer de fosfato de pH 7.6 debe ser gradual.
                </p>
              </div>

              <div className="flex gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Estabilidad del Buffer:</strong> Mantenga el buffer de fosfato potásico de sodio (60 mM) estrictamente refrigerado a 4°C y verifique el pH antes de verterlo sobre la cubeta de los tubos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Alerta de Variabilidad de Control</span>
              <span className="block mt-1 leading-normal text-[11px] text-amber-800">
                La velocidad de la reacción enzymática dG_neto/dt depende críticamente de la temperatura ambiental del laboratorio. Mantenga el gabinete alejado de aires acondicionados o calefactores directos.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
