import { useQuery, useMutation } from "convex/react";
import { Id, TableNames } from "../../convex/_generated/dataModel";
import { FunctionReference, SystemTableNames } from "convex/server";
import { useEffect, useState, useRef } from "react";

// TODO: Require a 'last updated' timestamp on the table for when multiple
// clients are editing the same value
export function useLocalValue<T, TableName extends TableNames>(
  query: FunctionReference<"query", "public", { id: Id<TableName> }, T>,
  id: Id<TableName>,
  mutation: FunctionReference<
    "mutation",
    "public",
    { id: Id<TableName>; value: T }
  >,
  syncIntervalMs: number = 1000
): [T | undefined, (value: T) => void] {
  const serverValue = useQuery(query, { id });
  const updateServer = useMutation(mutation);
  const [localValue, setLocalValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (localValue === undefined) {
      console.log("Initial value loaded:", serverValue);
      setLocalValue(serverValue);
    }
  }, [localValue, serverValue]);

  useEffect(() => {
    if (!localValue) return;

    console.log("Setting up sync interval for value:", localValue);
    const timer = setInterval(() => {
      console.log("Syncing to server:", localValue);
      void updateServer({ id, value: localValue });
    }, syncIntervalMs);

    return () => clearInterval(timer);
  }, [localValue, updateServer, id, syncIntervalMs]);

  return [localValue, setLocalValue];
}
