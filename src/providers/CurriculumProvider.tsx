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
  const [version, setVersion] = useState<CurriculumVersion>("v1");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Run migration so v2 tables exist regardless of version
      await migrateV2(db).catch((err) => {
        console.error("[CurriculumProvider] migrateV2 failed:", err);
      });

      const resolved = await resolveCurriculumVersion(db);
      if (!cancelled) setVersion(resolved);
    }

    init();
    return () => { cancelled = true; };
  }, [db]);

  return (
    <CurriculumContext.Provider value={version}>
      {children}
    </CurriculumContext.Provider>
  );
}
