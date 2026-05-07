"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/modules/onboarding/domain/useOnboardingStore";

export function OnboardingTrigger() {
  const { reset } = useOnboardingStore();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 cursor-pointer"
      aria-label="Помощь и онбординг"
      onClick={reset}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}
