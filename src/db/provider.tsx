import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "./client";

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error("useDatabase must be used within DatabaseProvider (database not yet initialized)");
  }
  return db;
}

interface DatabaseProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReady?: () => void;
}

export function DatabaseProvider({ children, fallback, onReady }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    getDatabase().then((database) => {
      setDb(database);
      onReady?.();
    });
  }, []);

  if (!db) return <>{fallback}</>;

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}
