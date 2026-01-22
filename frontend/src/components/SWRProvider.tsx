"use client";

import { SWRConfig } from "swr";
import type { PropsWithChildren } from "react";

export default function SWRProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
