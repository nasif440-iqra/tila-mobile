import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "./client";
import { ErrorFallback } from "../components/feedback/ErrorFallback";

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error("useDatabase must be used within DatabaseProvider (database not yet initialized)");
  }
  return db;
}

type InitState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; db: SQLiteDatabase };

interface DatabaseProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReady?: () => void;
}

export function DatabaseProvider({ children, fallback, onReady }: DatabaseProviderProps) {
  const [state, setState] = useState<InitState>({ status: "loading" });
  const attemptRef = useRef(0);

  const initDb = useCallback(() => {
    const thisAttempt = ++attemptRef.current;
    setState({ status: "loading" });

    const timeout = setTimeout(() => {
      if (attemptRef.current === thisAttempt) {
        setState({ status: "error", error: new Error("Database initialization timed out after 15 seconds") });
      }
    }, 15_000);

    getDatabase()
      .then((database) => {
        if (attemptRef.current !== thisAttempt) return;
        clearTimeout(timeout);
        setState({ status: "ready", db: database });
        onReady?.();
      })
      .catch((err) => {
        if (attemptRef.current !== thisAttempt) return;
        clearTimeout(timeout);
        setState({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
      });

    return () => {
      clearTimeout(timeout);
    };
  }, [onReady]);

  useEffect(() => {
    return initDb();
  }, [initDb]);

  if (state.status === "loading") return <>{fallback}</>;
  if (state.status === "error") return <ErrorFallback onRetry={initDb} />;

  return (
    <DatabaseContext.Provider value={state.db}>{children}</DatabaseContext.Provider>
  );
}
