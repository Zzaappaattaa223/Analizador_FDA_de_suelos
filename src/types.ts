/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExperimentMetadata {
  operador: string;
  nombreExp: string;
  tempAmbiente: number;
  tempReaccion: number;
  seqMetodologica: "Reacción con FDA pre-incubado" | "Reacción con tierra sola";
  ledWarmedUp: boolean;
  preIncubated: boolean;
  idSesion: string;
  fecha: string;
  objetivos: string;
  comentarios: string;
  tiempoIncubacion: number;
}

export interface SoilPrep {
  tamizado: boolean;
  aperturaMalla: string;
  secadoPrevio: boolean;
  humedadEstimada: number;
  relacionSueloBuffer: string;
}

export interface CameraConfig {
  iso: "200-400 (Recomendado)" | "800" | "Automático";
  balanceBlancos: "5000 Kelvin (Recomendado)" | "Automático";
  velocidadObturacion: "1/10 a 1/15 (Recomendado)" | "1/30" | "Automático";
  filtroFisicoColocado: boolean;
  blancoPhotoName: string;
  uploadedPhotos: string[];
  driveLink?: string;
  rotationAngle?: number; // 0, 90, 180, 270
  contrastOk?: boolean;
  backgroundOk?: boolean;
  spacingOk?: boolean;
}

export interface RoiConfig {
  cantidadTubos: number;
  tuboControlPositivo: string;
  sgVentanaY: number;
  sgPolinomio: number;
  showRawChannels: boolean;
  subRoiPadding?: number; // percentage of original crop, e.g. 15
  cameraShiftWarning?: boolean;
  shiftMinutos?: number;
}

export interface KineticsConfig {
  normalizarBlanco: boolean;
  normalizarMasa: boolean;
  sedimentationCutoff: number;
  inspectMinute: number;
}

export interface SampleData {
  id: number;
  name: string;
  mass: number; // in grams
  color: string;
  rawIntensities: number[]; // 61 values from 0 to 60 minutes
  rawBlueIntensities?: number[]; // Real blue channel intensities for G/B ratios
  isPositiveControl: boolean;
  isBlank: boolean;
}
