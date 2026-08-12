/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =========================================================================
// REAL IMAGE PROCESSOR & SCIENTIFIC COMPUTATION ENGINE (FIUNER FDA)
// =========================================================================

/**
 * Solves a small linear system of equations M * x = b using Gaussian elimination.
 * Used for dynamic Savitzky-Golay matrix inversion.
 */
function solveLinearSystem(M: number[][], b: number[]): number[] {
  const n = M.length;
  const A = M.map((row, i) => [...row, b[i]]); // Augmented matrix

  for (let i = 0; i < n; i++) {
    // Pivot search
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (A[i][n] - sum) / A[i][i];
  }
  return x;
}

/**
 * Calculates Savitzky-Golay filter coefficients for a given window size,
 * polynomial degree, and derivative order at the central point (index 0).
 */
export function getSavitzkyGolayCoefficients(
  windowSize: number,
  polyOrder: number,
  derivOrder: number
): number[] {
  // Window size must be odd and greater than polyOrder
  let w = windowSize;
  if (w % 2 === 0) w += 1;
  const m = (w - 1) / 2;

  // Build the Vandermonde matrix A
  const A: number[][] = [];
  for (let i = -m; i <= m; i++) {
    const row: number[] = [];
    for (let j = 0; j <= polyOrder; j++) {
      row.push(Math.pow(i, j));
    }
    A.push(row);
  }

  // Compute A^T * A (size: (polyOrder+1) x (polyOrder+1))
  const ATA: number[][] = [];
  const rows = polyOrder + 1;
  for (let i = 0; i < rows; i++) {
    ATA.push(new Array(rows).fill(0));
    for (let j = 0; j < rows; j++) {
      let sum = 0;
      for (let k = 0; k < w; k++) {
        sum += A[k][i] * A[k][j];
      }
      ATA[i][j] = sum;
    }
  }

  // Solve M * c_k = e_d to find least squares convolution coefficients
  // d-th derivative coefficients correspond to derivative multiplier (d!) times the d-th column of (A^T * A)^-1 * A^T
  const coefficients: number[] = [];
  const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
  const mult = factorial(derivOrder);

  // For the center point (x = 0), we can compute coefficients for each point k in the window
  for (let k = 0; k < w; k++) {
    // Construct b = A^T * e_k, where e_k is 1 at index k and 0 elsewhere
    const b: number[] = [];
    for (let i = 0; i < rows; i++) {
      b.push(A[k][i]);
    }
    // Solve (A^T * A) * c = b
    const c = solveLinearSystem(ATA, b);
    // Coefficient for the derivOrder-th term
    coefficients.push(c[derivOrder] * mult);
  }

  return coefficients;
}

/**
 * Applies a 1D Savitzky-Golay filter to a signal.
 * Correctly pads boundaries using symmetric extension.
 */
export function savgolFilter(
  signal: number[],
  windowSize: number,
  polyOrder: number,
  derivOrder: number
): number[] {
  const n = signal.length;
  if (n === 0) return [];
  
  let w = windowSize;
  if (w % 2 === 0) w += 1;
  if (w > n) w = n % 2 === 0 ? n - 1 : n;
  if (w < 3) return [...signal];

  const m = (w - 1) / 2;
  const coeffs = getSavitzkyGolayCoefficients(w, polyOrder, derivOrder);
  const result: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = -m; j <= m; j++) {
      // Symmetric boundary padding
      let idx = i + j;
      if (idx < 0) {
        idx = -idx;
      } else if (idx >= n) {
        idx = 2 * n - 2 - idx;
      }
      // Safe guard bounds
      if (idx < 0 || idx >= n) idx = i;
      
      sum += signal[idx] * coeffs[j + m];
    }
    result[i] = sum;
  }

  return result;
}

/**
 * Simple 1D peak finder on filtered derivative or intensity arrays.
 * Recreates SciPy find_peaks behavior with height and distance thresholds.
 */
export function findPeaks(
  signal: number[],
  heightThreshold: number,
  minDistance: number
): number[] {
  const peaks: number[] = [];
  const n = signal.length;

  for (let i = 1; i < n - 1; i++) {
    const val = signal[i];
    // Must be local maximum and exceed the threshold height
    if (val > signal[i - 1] && val > signal[i + 1] && val >= heightThreshold) {
      // Check distance constraint against previously added peaks
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}

/**
 * Extracts average blue and green channel intensities from an image within 8 ROIs.
 */
export function extractRealKinetics(
  canvas: HTMLCanvasElement,
  rois: { x1: number; y1: number; x2: number; y2: number }[],
  subRoiPadding: number
): { green: number; blue: number }[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return rois.map(() => ({ green: 0, blue: 0 }));

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  return rois.map((roi) => {
    // Calculate the sub-ROI bounding box using the security padding percentage
    const roiWidth = roi.x2 - roi.x1;
    const roiHeight = roi.y2 - roi.y1;
    const padX = Math.round(roiWidth * (subRoiPadding / 100));
    const padY = Math.round(roiHeight * (subRoiPadding / 100));

    const sx1 = Math.max(0, roi.x1 + padX);
    const sx2 = Math.min(width - 1, roi.x2 - padX);
    const sy1 = Math.max(0, roi.y1 + padY);
    const sy2 = Math.min(height - 1, roi.y2 - padY);

    let sumGreen = 0;
    let sumBlue = 0;
    let count = 0;

    for (let y = sy1; y <= sy2; y++) {
      for (let x = sx1; x <= sx2; x++) {
        const idx = 4 * (y * width + x);
        sumGreen += pixels[idx + 1]; // Green channel
        sumBlue += pixels[idx + 2];  // Blue channel
        count++;
      }
    }

    return {
      green: count > 0 ? sumGreen / count : 0,
      blue: count > 0 ? sumBlue / count : 0,
    };
  });
}

/**
 * Segments an image and returns the Y band and centers for 8 tubes.
 * Direct translation of Python calibration algorithm.
 */
export function calibrateOpticsT0(
  canvas: HTMLCanvasElement,
  sgVentanaY: number,
  sgVentanaX: number,
  sgPolinomio: number,
  factorReduccion: number
): {
  yCentral: number;
  altoBanda: number;
  rois: { id: number; x1: number; x2: number; y1: number; y2: number; cx: number }[];
  perfilX: number[];
  centrosX: number[];
} {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to get 2D context from canvas");
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // 1. Calculate blue channel Y profile (average blue intensity per row)
  const perfilY = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let sumBlue = 0;
    for (let x = 0; x < width; x++) {
      sumBlue += pixels[4 * (y * width + x) + 2]; // Blue channel
    }
    perfilY[y] = sumBlue / width;
  }

  // 2. Savitzky-Golay in Y to find band borders (y_min & y_max)
  const winY = Math.max(5, Math.round((sgVentanaY / 100.0) * height));
  const derivadaY = savgolFilter(perfilY, winY, sgPolinomio, 1);

  let yMin = 0;
  let maxDeriv = -Infinity;
  for (let y = 0; y < height; y++) {
    if (derivadaY[y] > maxDeriv) {
      maxDeriv = derivadaY[y];
      yMin = y;
    }
  }

  let yMax = height - 1;
  let minDeriv = Infinity;
  for (let y = yMin; y < height; y++) {
    if (derivadaY[y] < minDeriv) {
      minDeriv = derivadaY[y];
      yMax = y;
    }
  }

  const yCentral = Math.round((yMin + yMax) / 2);
  const altoBanda = yMax - yMin;

  // 3. Extract Y-band and compute X blue profile
  const perfilX = new Array(width).fill(0);
  const startY = Math.max(0, yMin);
  const endY = Math.min(height - 1, yMax);
  const hBand = endY - startY + 1;

  for (let x = 0; x < width; x++) {
    let sumBlue = 0;
    for (let y = startY; y <= endY; y++) {
      sumBlue += pixels[4 * (y * width + x) + 2];
    }
    perfilX[x] = sumBlue / hBand;
  }

  // 4. Savitzky-Golay in X to find peak transitions and detect tubes
  const winX = Math.max(5, Math.round((sgVentanaX / 100.0) * width));
  const derivadaX = savgolFilter(perfilX, winX, sgPolinomio, 1);

  // Peak and valley detection to segment tubes
  let maxDerivX = 0;
  for (let x = 0; x < width; x++) {
    const absVal = Math.abs(derivadaX[x]);
    if (absVal > maxDerivX) maxDerivX = absVal;
  }
  const umbralX = maxDerivX * 0.20;

  // Find peaks in positive and negative derivatives
  const bordesIzq = findPeaks(derivadaX, umbralX, Math.round(width / 30));
  const negDerivX = derivadaX.map(v => -v);
  const bordesDer = findPeaks(negDerivX, umbralX, Math.round(width / 30));

  const listCentrosX: { bIzq: number; bDer: number; cx: number }[] = [];
  for (const bIzq of bordesIzq) {
    const bDerCands = bordesDer.filter((b) => b > bIzq);
    if (bDerCands.length > 0) {
      const bDer = bDerCands[0];
      const wTube = bDer - bIzq;
      if (wTube > width * 0.01 && wTube < width * 0.15) {
        listCentrosX.push({ bIzq, bDer, cx: Math.round((bIzq + bDer) / 2) });
      }
    }
  }

  // Sort and filter exactly 8 ROIs (or fall back to uniform segmentation if not matching)
  listCentrosX.sort((a, b) => a.cx - b.cx);
  let centrosFinales = listCentrosX.map((c) => c.cx);

  // If auto-detection fails or gives wrong tube count, divide uniformly as robust fallback
  if (centrosFinales.length !== 8) {
    centrosFinales = [];
    const step = width / 9;
    for (let i = 1; i <= 8; i++) {
      centrosFinales.push(Math.round(i * step));
    }
  }

  // Determine standard width/height based on detected average
  let anchoMin = width * 0.08;
  if (listCentrosX.length > 0) {
    const widths = listCentrosX.map((c) => c.bDer - c.bIzq);
    anchoMin = Math.min(...widths);
  }

  const redPx = Math.round(anchoMin * factorReduccion * 2);
  const wRoiFijo = Math.round(anchoMin - redPx);
  const hRoiFijo = Math.round(altoBanda - redPx);

  const rois = centrosFinales.map((cx, idx) => {
    const x1 = Math.max(0, Math.round(cx - wRoiFijo / 2));
    const x2 = Math.min(width - 1, Math.round(cx + wRoiFijo / 2));
    const y1 = Math.max(0, Math.round(yCentral - hRoiFijo / 2));
    const y2 = Math.min(height - 1, Math.round(yCentral + hRoiFijo / 2));

    return {
      id: idx + 1,
      x1,
      x2,
      y1,
      y2,
      cx,
    };
  });

  return {
    yCentral,
    altoBanda,
    rois,
    perfilX,
    centrosX: centrosFinales,
  };
}

/**
 * Helper to dynamically load an image from Google Drive file or File Object as a canvas element.
 */
export function drawImageToCanvas(
  src: string | File,
  rotationAngle: number = 180
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to create canvas context"));
        return;
      }

      // Handle rotation
      if (rotationAngle === 90 || rotationAngle === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas);
    };

    img.onerror = (err) => reject(err);

    if (src instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(src);
    } else {
      img.src = src;
    }
  });
}
