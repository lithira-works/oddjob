import { answerJob, topUp, type LedgerEntry } from "../credits";
import { boardJobs } from "./jobs";

/** SAMPLE DATA. A made-up opening ledger per fictional worker, so the Credits tab can be judged. */
export function sampleLedger(workerSlug: string, tradeSlug: string): LedgerEntry[] {
  const opening = topUp([], `welcome:${workerSlug}`, 10);
  const job = boardJobs.find((j) => j.tradeSlug === tradeSlug);
  return job ? answerJob(opening, job.id, job.cost) : opening;
}
