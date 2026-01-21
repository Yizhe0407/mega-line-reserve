'use client'
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStepStore } from "@/store/step-store";

export default function VerifyLIFF() {
  const router = useRouter();
  const { fetchUserData } = useStepStore();
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
