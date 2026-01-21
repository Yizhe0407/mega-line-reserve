'use client'
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStepUserData } from "@/hooks/useStepUserData";

export default function VerifyLIFF() {
  const router = useRouter();
  const { fetchUserData } = useStepUserData();
  const liffInitialized = useRef(false);

  useEffect(() => {
    if (liffInitialized.current) {
      return;
    }
    liffInitialized.current = true;

    fetchUserData(router);
  }, [router, fetchUserData]);

  return <div></div>;
}
