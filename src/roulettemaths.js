// src/utils/rouletteMath.js

export const WHEEL_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0 to 36

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function getColor(number) {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
}

/**
 * Chi-Square Goodness-of-Fit Test for European Roulette
 * Compares observed pocket hits against expected uniform distribution (N / 37).
 * Degrees of Freedom: df = 37 - 1 = 36
 * Critical values:
 *   p < 0.05 -> chiSquare > 50.998 (Warning: Potential mechanical bias)
 *   p < 0.01 -> chiSquare > 58.619 (Critical: Statistically significant bias)
 */
export function calculateWheelBias(history = []) {
  const numberedSpins = history
    .map((item) => (typeof item === "number" ? item : item?.number))
    .filter((n) => typeof n === "number" && n >= 0 && n <= 36);

  const N = numberedSpins.length;

  if (N < 37) {
    return {
      totalNumbered: N,
      chiSquare: 0,
      status: "insufficient_data",
      message: `Sample size too small (${N}/37 spins). Record more spins to evaluate bias.`,
    };
  }

  const expected = N / 37;
  const observedCounts = new Array(37).fill(0);
  for (const num of numberedSpins) {
    observedCounts[num]++;
  }

  let chiSquare = 0;
  for (let i = 0; i < 37; i++) {
    chiSquare += Math.pow(observedCounts[i] - expected, 2) / expected;
  }

  let status = "normal";
  let message = "Outcomes match expected random uniform distribution (no mechanical bias detected).";

  if (chiSquare > 58.619) {
    status = "critical_bias";
    message = "Critical anomaly detected (p < 0.01). Significant pocket variance—inspect wheel leveling and frets.";
  } else if (chiSquare > 50.998) {
    status = "warning_bias";
    message = "Moderate anomaly (p < 0.05). Variance exceeds normal operational tolerance.";
  }

  return {
    totalNumbered: N,
    chiSquare: Number(chiSquare.toFixed(2)),
    status,
    message,
    expectedPerPocket: Number(expected.toFixed(2)),
  };
}