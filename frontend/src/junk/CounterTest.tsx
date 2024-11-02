import { useLocalValue } from "../utils/convex";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";

const COUNTER_ID = "kh71nk3hhff7tm52zqyva7b97n73t5k6" as Id<"counters">;

export function CounterTest() {
  const [value, setValue] = useLocalValue(
    api.counters.get,
    COUNTER_ID,
    api.counters.update,
    1000 // sync every second
  );

  if (value === undefined) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1>Counter Test</h1>
      <div className="flex gap-4 items-center">
        <button
          onClick={() => setValue((value ?? 0) - 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          -
        </button>
        <span className="text-2xl">{value}</span>
        <button
          onClick={() => setValue((value ?? 0) + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}
