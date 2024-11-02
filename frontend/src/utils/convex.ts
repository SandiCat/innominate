import { useQuery, useMutation } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { FunctionReference, SystemTableNames } from "convex/server";
import { useEffect, useState, useRef } from "react";

export function useLocalValue<T, TableName extends SystemTableNames>(
  query: FunctionReference<"query", "public", { id: Id<TableName> }, T>,
  id: Id<TableName>,
  mutation: FunctionReference<
    "mutation",
    "public",
    { id: Id<TableName>; value: T },
    void
  >,
  syncIntervalMs: number = 1000
): [T | undefined, (value: T) => void] {
  const serverValue = useQuery(query, { id });
  const updateServer = useMutation(mutation);
  const [localValue, setLocalValue] = useState<T | undefined>(serverValue);
  const lastSyncedValue = useRef<T>();

  useEffect(() => {
    if (serverValue !== undefined && serverValue !== lastSyncedValue.current) {
      setLocalValue(serverValue);
    }
  }, [serverValue]);

  useEffect(() => {
    if (!localValue) return;

    const timer = setInterval(() => {
      if (localValue !== lastSyncedValue.current) {
        lastSyncedValue.current = localValue;
        void updateServer({ id, value: localValue });
      }
    }, syncIntervalMs);

    return () => clearInterval(timer);
  }, [localValue, updateServer, id, syncIntervalMs]);

  return [localValue, setLocalValue];
}
