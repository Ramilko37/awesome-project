import { Suspense } from "react";
import { resolveAuthRedirect } from "@/modules/auth/model/auth-redirect";
import { RegisterPage } from "@/modules/auth/ui/register-page";

type RegisterRouteSearchParams = Promise<{
  next?: string | string[];
}>;

export default async function Page({ searchParams }: { searchParams: RegisterRouteSearchParams }) {
  const params = await searchParams;
  const rawRedirect = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectTo = resolveAuthRedirect(rawRedirect);

  return (
    <Suspense fallback={null}>
      <RegisterPage redirectTo={redirectTo} />
    </Suspense>
  );
}
