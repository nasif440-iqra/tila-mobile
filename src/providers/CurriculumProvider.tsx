import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CurriculumVersion } from "../config/curriculumFlags";
import { resolveCurriculumVersion } from "../config/curriculumFlags";
import { migrateV2 } from "../db/migrate-v2";
import { useDatabase } from "../db/provider";

const CurriculumContext = createContext<CurriculumVersion>("v1");

export function useCurriculumVersion(): CurriculumVersion {
  return useContext(CurriculumContext);
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function CurriculumProvider({ children, fallback }: Props) {
  const db = useDatabase();
  // Default to v1 immediately so the app tree never unmounts.
  // The async resolution updates this in-place if v2 is configured.
  const [version, setVersion] = useState<CurriculumVersion>("v1");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Run v2 migration (idempotent — creates tables + column if missing)
      await migrateV2(db);

      // Resolve which curriculum to use
      const v = await resolveCurriculumVersion(db);
      if (!cancelled) setVersion(v);
    }

    init().catch((err) => {
      console.error("CurriculumProvider init failed:", err);
      // Already defaulted to v1, no action needed
    });

    return () => { cancelled = true; };
  }, [db]);

  return (
    <CurriculumContext.Provider value={version}>
      {children}
    </CurriculumContext.Provider>
  );
}
