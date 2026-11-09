import CompanyRegistration from "@/modules/auth/components/company-reg/CompanyRegistration";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Company Registration");

export default function CompanyRegPage() {
  return <CompanyRegistration />;
}
