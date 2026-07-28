import { SiteDetailPage } from "@/modules/sites/ui/site-detail-page";
import { mockSites } from "@/shared/lib/mock-data";

export function generateStaticParams() {
  return mockSites.map((site) => ({ id: site.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SiteDetailPage siteId={id} />;
}
