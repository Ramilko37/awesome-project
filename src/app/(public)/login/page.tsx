import { Suspense } from "react";
import { LoginPage } from "@/modules/auth/ui/login-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
