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

  // TEMPORARY FORCE V2: bypass all resolution logic for testing
  // TODO: revert to async resolution before merging
  const version: CurriculumVersion = "v2";

  // Still run migration in background so v2 tables exist
  useEffect(() => {
    migrateV2(db).catch((err) => {
      console.error("[CurriculumProvider] migrateV2 failed:", err);
    });
  }, [db]);

  return (
    <CurriculumContext.Provider value={version}>
      {children}
    </CurriculumContext.Provider>
  );
}
