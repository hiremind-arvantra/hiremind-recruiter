import type {
  ApplicantDetail,
  ApplicationResponse,
  ApplicationStatusKey,
} from "@/modules/company/jobs/services/applications.service";
import type { JobFullDetail } from "@/modules/company/jobs/services/job.service";
import type { MatchAnalysis } from "../../types";

/** Everything a tab needs — the page loads it once and hands it down. */
export interface TabProps {
  analysis: MatchAnalysis;
  job: JobFullDetail;
  applicant: ApplicantDetail;
  application: ApplicationResponse | null;
  candidateName: string;
  busy: ApplicationStatusKey | null;
  onStatus: (status: ApplicationStatusKey) => void;
}
