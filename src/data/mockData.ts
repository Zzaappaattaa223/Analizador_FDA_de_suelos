/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SampleData, ExperimentMetadata, SoilPrep, CameraConfig, RoiConfig, KineticsConfig } from "../types";

export const DEFAULT_METADATA: ExperimentMetadata = {
  operador: "Dra. Elena Rostova",
  nombreExp: "Ensayo Microbiológico Suelo Altiplánico Sector B",
  tempAmbiente: 24.5,
  tempReaccion: 30.0,
  seqMetodologica: "Reacción con FDA pre-incubado",
  ledWarmedUp: true,
  preIncubated: true,
  idSesion: "EXP-20260808-154210",
  fecha: "2026-08-08",
  objetivos: "Determinar la actividad biológica general de hidrolasas mediante hidrólisis de FDA en suelos con labranza tradicional vs siembra directa.",
  comentarios: "Muestras recolectadas a 10cm de profundidad en condiciones secas.",
  tiempoIncubacion: 15,
};

export const DEFAULT_SOIL_PREP: SoilPrep = {
  tamizado: true,
  aperturaMalla: "< 2 mm (Tamiz Standard)",
  secadoPrevio: true,
  humedadEstimada: 12.4,
  relacionSueloBuffer: "1.0g Suelo / 15mL Buffer Fosfato pH 7.6",
};

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  iso: "200-400 (Recomendado)",
  balanceBlancos: "5000 Kelvin (Recomendado)",
  velocidadObturacion: "1/10 a 1/15 (Recomendado)",
  filtroFisicoColocado: true,
  blancoPhotoName: "BLANCO_T0_MUESTRA.png",
  uploadedPhotos: [
    "BLANCO_T0_MUESTRA.png",
    "REACCION_T05_MIN.png",
    "REACCION_T10_MIN.png",
    "REACCION_T15_MIN.png",
    "REACCION_T20_MIN.png",
    "REACCION_T25_MIN.png",
    "REACCION_T30_MIN.png",
    "REACCION_T40_MIN.png",
    "REACCION_T50_MIN.png",
    "REACCION_T60_MIN.png"
  ],
};

export const DEFAULT_ROI_CONFIG: RoiConfig = {
  cantidadTubos: 8,
  tuboControlPositivo: "Tubo 1",
  sgVentanaY: 1.5,
  sgPolinomio: 4,
  showRawChannels: false,
};

export const DEFAULT_KINETICS_CONFIG: KineticsConfig = {
  normalizarBlanco: true,
  normalizarMasa: true,
  sedimentationCutoff: 5,
  inspectMinute: 25,
};

// Generates raw intensity values from 0 to 60 minutes
// Modeling both initial turbidity sedimentation (drops first 5 mins) and FDA enzymic conversion (fluorescein yellow-green rise)
const generateKinetics = (
  type: "positive_control" | "blank" | "soil_high_active" | "soil_mid_active" | "soil_low_active",
  mass: number
): number[] => {
  const intensities: number[] = [];
  
  for (let t = 0; t <= 60; t++) {
    let value = 0;
    
    // Sedimentation noise (only present if it contains soil, i.e., not positive control or pure blank)
    const hasSoil = type !== "positive_control" && type !== "blank";
    const sedimentNoise = hasSoil ? 28 * Math.exp(-t / 1.8) : 0;
    
    // Enzymatic reaction kinetics (Michaelis-Menten style saturation curve)
    if (type === "positive_control") {
      // Fast rise, high plateau, no soil mass dependency
      value = 15 + 215 * (1 - Math.exp(-t / 12.0));
    } else if (type === "blank") {
      // Very slow non-enzymatic auto-hydrolysis
      value = 12 + 18 * (1 - Math.exp(-t / 45.0));
    } else if (type === "soil_high_active") {
      // Soil with rich microbiology, proportional to mass
      const reactionRate = 160 * (mass / 0.5); // normalized to 0.5g
      value = 22 + reactionRate * (1 - Math.exp(-(t) / 22.0));
    } else if (type === "soil_mid_active") {
      const reactionRate = 110 * (mass / 0.5);
      value = 18 + reactionRate * (1 - Math.exp(-(t) / 24.0));
    } else {
      // soil_low_active (sandy/degraded soil)
      const reactionRate = 45 * (mass / 0.5);
      value = 15 + reactionRate * (1 - Math.exp(-(t) / 28.0));
    }
    
    // Combine reaction + turbidity noise + slight random electronic noise
    const noise = Math.sin(t * 0.8) * 0.4;
    const finalValue = Math.max(0, Math.round(value + sedimentNoise + noise));
    intensities.push(finalValue);
  }
  
  return intensities;
};

export const INITIAL_SAMPLES: SampleData[] = [
  {
    id: 1,
    name: "Tubo 1 (Control Positivo)",
    mass: 0.0, // control soluble
    color: "#facc15", // Yellow
    rawIntensities: generateKinetics("positive_control", 0),
    isPositiveControl: true,
    isBlank: false,
  },
  {
    id: 2,
    name: "Tubo 2 (Suelo Agrícola A)",
    mass: 0.50,
    color: "#4ade80", // Green
    rawIntensities: generateKinetics("soil_high_active", 0.50),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 3,
    name: "Tubo 3 (Suelo Agrícola B)",
    mass: 0.48,
    color: "#3b82f6", // Blue
    rawIntensities: generateKinetics("soil_high_active", 0.48),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 4,
    name: "Tubo 4 (Suelo Bosque Nativo)",
    mass: 0.52,
    color: "#ec4899", // Pink
    rawIntensities: generateKinetics("soil_high_active", 0.52),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 5,
    name: "Tubo 5 (Suelo Cultivo Rotativo)",
    mass: 0.51,
    color: "#f97316", // Orange
    rawIntensities: generateKinetics("soil_mid_active", 0.51),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 6,
    name: "Tubo 6 (Suelo Degradado/Erosionado)",
    mass: 0.49,
    color: "#8b5cf6", // Purple
    rawIntensities: generateKinetics("soil_low_active", 0.49),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 7,
    name: "Tubo 7 (Suelo Control Testigo)",
    mass: 0.50,
    color: "#06b6d4", // Cyan
    rawIntensities: generateKinetics("soil_mid_active", 0.50),
    isPositiveControl: false,
    isBlank: false,
  },
  {
    id: 8,
    name: "Tubo 8 (Blanco de Reacción)",
    mass: 0.0,
    color: "#9ca3af", // Gray
    rawIntensities: generateKinetics("blank", 0),
    isPositiveControl: false,
    isBlank: true,
  },
];
