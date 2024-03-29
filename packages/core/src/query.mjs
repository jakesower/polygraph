import { intersperse, multiApply } from "@blossom/utils/arrays";
import { getPath } from "@blossom/utils/lenses";
import { mapObj } from "@blossom/utils/objects";

export {
  denormalizeQuery,
  normalizeQuery,
  normalizeGetQuery,
  normalizeSetQuery,
} from "./query/normalize-query.mjs";
export { queryTree } from "./query/query-tree.mjs";

export function flatMapQuery(query, fn) {
  const go = (subquery, path) => {
    const nodeResult = fn(subquery, path);
    const relResults = Object.entries(subquery.relationships).flatMap(
      ([relKey, relQuery]) => go(relQuery, [...path, relKey]),
    );

    return [nodeResult, ...relResults].flat();
  };

  return go(query, []);
}

export function flatMapQueryTree(query, tree, fn) {
  const go = (subquery, subTree, path) => {
    const nodeResult = fn(subquery, subTree, path);
    const relResults = Object.entries(subquery.relationships).flatMap(
      ([relKey, relQuery]) =>
        multiApply(subTree?.[relKey], (rel) => go(relQuery, rel, [...path, relKey])),
    );

    return [nodeResult, ...relResults];
  };

  return go(query, tree, []);
}

export function flattenSubQueries(query) {
  return [query, ...Object.values(query.relationships).map(flattenSubQueries)];
}

export function getQueryPath(query, path) {
  return getPath(query, intersperse(path, "relationships"));
}

export function mapQuery(query, fn) {
  const go = (subquery, path) => {
    const nodeResult = fn(subquery, path);

    return {
      ...nodeResult,
      relationships: mapObj(nodeResult.relationships, (relQuery, relKey) =>
        go(relQuery, [...path, relKey]),
      ),
    };
  };

  return go(query, []);
}
