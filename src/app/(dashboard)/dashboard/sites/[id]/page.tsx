import { SiteDetailPage } from "@/modules/sites/ui/site-detail-page";

export default function Page({ params }: { params: { id: string } }) {
  return <SiteDetailPage siteId={params.id} />;
}
