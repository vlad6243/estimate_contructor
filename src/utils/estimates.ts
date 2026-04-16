import type { EstimateItem, EstimateTriple } from "../types";

const estimateFields = ["optimistic", "realistic", "pessimistic"] as const;

export function emptyEstimate(): EstimateTriple {
  return {
    optimistic: null,
    realistic: null,
    pessimistic: null,
  };
}

export function averageEstimate(item: EstimateItem): EstimateTriple {
  const entries = Object.values(item.estimatesByParticipant);

  if (!entries.length) {
    return emptyEstimate();
  }

  const result = emptyEstimate();

  estimateFields.forEach((field) => {
    const values = entries
      .map((entry) => entry[field])
      .filter((value): value is number => value !== null);

    if (!values.length) {
      result[field] = null;
      return;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    result[field] = Math.round((total / values.length) * 10) / 10;
  });

  return result;
}

export function estimateSpread(item: EstimateItem) {
  const result = emptyEstimate();

  estimateFields.forEach((field) => {
    const values = Object.values(item.estimatesByParticipant)
      .map((entry) => entry[field])
      .filter((value): value is number => value !== null);

    if (!values.length) {
      result[field] = null;
      return;
    }

    result[field] = Math.max(...values) - Math.min(...values);
  });

  return result;
}

export function sumEstimates(estimates: EstimateTriple[]) {
  return estimateFields.reduce<EstimateTriple>(
    (accumulator, field) => {
      const total = estimates.reduce(
        (sum, estimate) => sum + (estimate[field] ?? 0),
        0,
      );

      accumulator[field] = Math.round(total * 10) / 10;
      return accumulator;
    },
    emptyEstimate(),
  );
}

export function formatEstimate(value: number | null) {
  return value === null ? "—" : value.toString();
}
