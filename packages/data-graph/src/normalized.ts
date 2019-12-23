import { ResourceReference, NormalizedResource, Query, QueryRelationship } from './types';
import { DataGraph, DataGraphClass } from './base';
import { mapObj } from '@polygraph/utils';

interface NormalizedGraph {
  resources: { [k: string]: { [k: string]: NormalizedResource } };
  root: ResourceReference | ResourceReference[];
}

export class NormalizedDataGraphClass {
  constructor(public graph: NormalizedGraph, public query: Query) {}

  public base(): DataGraphClass {
    const { graph, query } = this;
    const { root, resources } = graph;

    const expand = (
      queryGraph: Query | QueryRelationship,
      resourceReference: ResourceReference | ResourceReference[] | null
    ) => {
      if (!resourceReference) return null;
      if (Array.isArray(resourceReference))
        return resourceReference.map(rr => expand(queryGraph, rr));

      const { type, id } = resourceReference;
      const resource = resources[type][id];

      const relationships = mapObj(queryGraph.relationships || {}, (relGraph, relName) =>
        expand(relGraph, resource.relationships[relName])
      );

      return { type, id, attributes: resource.attributes, relationships };
    };

    return DataGraph(expand(query, root), query);
  }
}

export function NormalizedDataGraph(graph: NormalizedGraph, query: Query) {
  return new NormalizedDataGraphClass(graph, query);
}
