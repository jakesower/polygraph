import { Query, Resource, ResourceReference } from './types';
import { mapObj, mergeWith, uniqBy } from '@polygraph/utils';
import { NormalizedDataGraph, NormalizedDataGraphClass } from './normalized';

/*
 * Possible forms:
 *
 * PG base (fully expanded over a query)
 * Normalized (resources once with references)
 * Graph (edges and vertices)
 * Verteces with edges (double referenced from each connected resource)
 * Compressed (for transport)
 */

// function applyOrMap<T, U>(maybeArray: T, fn: (arg: T) => U): U;
// function applyOrMap<T, U>(maybeArray: T[], fn: (arg: T) => U): U[] {
function applyOrMap<T, U>(maybeArray: T | T[], fn: (arg: T) => U): U | U[] {
  return Array.isArray(maybeArray) ? maybeArray.map(fn) : fn(maybeArray);
}

export class DataGraphClass {
  constructor(public root: Resource | Resource[], public query: Query) {}

  // TODO: cache
  public normalized(): NormalizedDataGraphClass {
    const { root, query } = this;

    let resources = {};
    const makeRef = (vs: Resource | Resource[]): ResourceReference | ResourceReference[] =>
      applyOrMap(vs, r => ({ type: r.type, id: r.id }));

    const normalizedRoot = makeRef(root);
    const extract = (resource: Resource) => {
      const { type, id } = resource;
      const relationships = resource.relationships;

      resources[type] = resources[type] || {};

      const relationshipRefs = mapObj(relationships, makeRef);
      const prevRels = resources[type][id] ? resources[type][id].relationships : {};
      const nextRels = mergeWith(prevRels, relationshipRefs, (prev, cur) =>
        Array.isArray(prev) && Array.isArray(cur) ? uniqBy([...prev, ...cur], x => x.id) : prev
      );

      Object.values(relationships).forEach(rel => applyOrMap(rel, extract));

      resources[type][id] = {
        ...resource,
        relationships: nextRels,
      };
    };

    applyOrMap(root, extract);

    return NormalizedDataGraph({ root: normalizedRoot, resources }, query);
  }

  // /**
  //  *
  //  * @param {DataGraph} other the graph which will be imposed upon this
  //  *
  //  * @returns {DataGraph} a DataGraph with all of the verteces and edges of `other` honored over the original
  //  */
  // public impose(other: DataGraph): DataGraph {
  //   // First compare verteces
  // }
}

export function DataGraph(root: Resource | Resource[], query: Query) {
  return new DataGraphClass(root, query);
}
