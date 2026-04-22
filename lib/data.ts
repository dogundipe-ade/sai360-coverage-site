import data from "./data/coverage.json";
import type { CoverageData } from "./types";

export function getCoverage(): CoverageData {
  return data as unknown as CoverageData;
}
