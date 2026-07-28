import { Suspense } from "react";
import { resolveAuthRedirect } from "@/modules/auth/model/auth-redirect";
import { LoginPage } from "@/modules/auth/ui/login-page";

type LoginRouteSearchParams = Promise<{
  next?: string | string[];
}>;

export default async function Page({ searchParams }: { searchParams: LoginRouteSearchParams }) {
  const params = await searchParams;
  const rawRedirect = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectTo = resolveAuthRedirect(rawRedirect);

  return (
    <Suspense fallback={null}>
      <LoginPage redirectTo={redirectTo} />
    </Suspense>
  );
}
