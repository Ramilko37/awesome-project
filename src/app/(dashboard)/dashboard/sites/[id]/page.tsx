import { SiteDetailPage } from "@/modules/sites/ui/site-detail-page";
import { mockSites } from "@/shared/lib/mock-data";

export function generateStaticParams() {
  return mockSites.map((site) => ({ id: site.id }));
}

export default function Page({ params }: { params: { id: string } }) {
  return <SiteDetailPage siteId={params.id} />;
}
