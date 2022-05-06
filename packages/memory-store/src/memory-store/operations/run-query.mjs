import { pipeWithContext } from "@polygraph/utils";
import { compileConstraints } from "./compile-constraints.mjs";
import { expandRelatedOperation } from "./expand-related.mjs"; // eslint-disable-line import/no-cycle
import { firstOperation, firstOrderOperation } from "./first.mjs";
import { limitOperation, limitOrderOperation } from "./limit.mjs";
import { orderOperation } from "./order.mjs";
import { selectProperties } from "./select-properties.mjs";

// some operations can be combined as optimizations; the convention is to put the combined
// operation functions in the first file alphabetically

export function runQuery(query, getFromStore, context) {
  const resourceOrResources = getFromStore(query);
  return processResults(resourceOrResources, getFromStore, context);
}

export function processResults(resourceOrResources, getFromStore, context) {
  if (resourceOrResources == null) return null;

  const { query } = context;
  const { first, limit, offset, order } = query;
  const useLimit = limit || offset;

  // operation combination functions for optimization
  const combinedOps = [
    { test: first && order, fns: [firstOrderOperation] },
    { test: useLimit && order, fns: [limitOrderOperation] },
    {
      test: true,
      fns: [
        order && orderOperation,
        useLimit && limitOperation,
        first && firstOperation,
      ].filter(Boolean),
    },
  ];

  const paramPipe = [
    compileConstraints(query),
    ...combinedOps.find(({ test }) => test).fns,
    selectProperties,
    expandRelatedOperation(getFromStore),
  ];

  return pipeWithContext(paramPipe, context)(resourceOrResources);
}
