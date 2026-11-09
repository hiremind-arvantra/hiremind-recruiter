import type { Metadata } from "next";
import AddClientPage from "@/modules/company/clients/AddClientPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Edit Client" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddClientPage clientId={decodeId(id)} />;
}
