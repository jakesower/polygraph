import { ResourceGraph, Edge, ResourceGraphWithoutRelationships } from './types';
import { applyOrMap, forEachObj, mapObj } from '@polygraph/utils';

// export function reduceGraph<T>(
//   fullGraph: ResourceGraph,
//   init: T,
//   fn: (acc: T, graph: ResourceGraph) => T
// ): T {}

interface Decomposed extends Object {
  vertices: ResourceGraphWithoutRelationships[];
  edges: Edge[];
}

export function decomposeGraph(fullGraph: ResourceGraph): Decomposed {
  const { type, id, relationships } = fullGraph;

  let related = { vertices: [], edges: [] } as Decomposed;

  forEachObj(relationships || {}, (relResources, relName) => {
    const ary = Array.isArray(relResources) ? relResources : [relResources];

    const localEdges = ary.map(r => ({
      start: { type, id },
      end: { type: r.type, id: r.id },
      type: relName,
    })) as Edge[];

    related.edges = localEdges;

    ary.map(decomposeGraph).forEach(d => {
      related.vertices = [...related.vertices, ...d.vertices];
      related.edges = [...related.edges, ...d.edges];
    });
  });

  // TODO: include attributes
  return { vertices: [{ type, id }, ...related.vertices], edges: related.edges };
}

export function flattenGraph(fullGraph: ResourceGraph, schema) {
  const nextRels = mapObj(fullGraph.relationships || {}, rels =>
    applyOrMap(rels, ({ id, type }) => ({ id, type }))
  );

  let out = [{ ...fullGraph, relationships: nextRels }];

  forEachObj(fullGraph.relationships || {}, relResources => {
    const ary = Array.isArray(relResources) ? relResources : [relResources];

    ary.map(flattenGraph).forEach(d => {
      out = [...out, ...d];
    });
  });

  return out;
}

// export function indexGraph(fullGraph: ResourceGraph) {}
