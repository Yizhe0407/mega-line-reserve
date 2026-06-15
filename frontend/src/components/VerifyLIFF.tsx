'use client'
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStepUserData } from "@/hooks/useStepUserData";

export default function VerifyLIFF() {
  const pathname = usePathname();
  const { fetchUserData } = useStepUserData();
  const liffInitialized = useRef(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      return;
    }
    if (liffInitialized.current) {
      return;
    }
    liffInitialized.current = true;

    fetchUserData();
  }, [fetchUserData, pathname]);

  return null;
}
