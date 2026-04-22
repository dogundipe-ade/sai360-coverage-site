import { getCoverage } from "@/lib/data";
import { CoverageExplorer } from "./components/CoverageExplorer";

export default function Page() {
  const data = getCoverage();
  return <CoverageExplorer data={data} />;
}
