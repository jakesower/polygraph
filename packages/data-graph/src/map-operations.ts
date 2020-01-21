import {
  GraphOperation,
  ResourceReference,
  Resource,
  ResourceReferenceLike,
  RelationshipReplacement,
  RelationshipReplacements,
  DeleteInterface,
  MultiDeleteInterface,
} from './types';
import { mapObj } from '@polygraph/utils';

interface ExternalOperations {
  create: (resourceGraph: Resource) => GraphOperation[];
  update: (resourceGraph: Resource) => GraphOperation[];
  delete: (resource: ResourceReferenceLike) => GraphOperation[];
  replaceRelationship: (resource: RelationshipReplacement) => GraphOperation[];
  replaceRelationships: (resource: RelationshipReplacements) => GraphOperation[];
  appendRelationships: (resource: RelationshipReplacements) => GraphOperation[];
  deleteRelationship: (resource: DeleteInterface) => GraphOperation[];
  deleteRelationships: (resource: MultiDeleteInterface) => GraphOperation[];
}

function ref(resourceLike: ResourceReferenceLike): ResourceReference {
  return { type: resourceLike.type, id: resourceLike.id };
}

export const operationsMap: ExternalOperations = {
  create({ type, id, attributes, relationships }) {
    const relOpsObj = mapObj(relationships || {}, (relResources, relName) => {
      const ary = Array.isArray(relResources) ? relResources : [relResources];

      return ary.map(r => ({
        operation: 'AddEdge',
        start: { type, id },
        end: ref(r),
        type: relName,
      })) as GraphOperation[];
    });

    const relOps: GraphOperation[] = Object.values(relOpsObj).reduce((a, b) => [...a, ...b], []);

    return [{ operation: 'AddVertex', type, id, attributes }, ...relOps];
  },
  update({ type, id, attributes, relationships }) {
    const typesToReplace = Object.keys(relationships || {});
    const relOpsObj = mapObj(relationships || {}, (relResources, relName) => {
      const ary = Array.isArray(relResources) ? relResources : [relResources];

      return ary.map(r => ({
        operation: 'AddEdge',
        start: { type, id },
        end: ref(r),
        type: relName,
      })) as GraphOperation[];
    });

    const relOps: GraphOperation[] = Object.values(relOpsObj).reduce((a, b) => [...a, ...b], []);

    return [{ operation: 'AddVertex', type, id, attributes }, ...relOps];
  },
  delete(resource) {
    return [{ operation: 'RemoveVertex', vertex: ref(resource) }];
  },

  replaceRelationship({ resource, target, type }) {
    return [
      { operation: 'RemoveEdgesOfType', vertex: ref(resource), type },
      { operation: 'AddEdge', start: ref(resource), end: ref(target), type },
    ];
  },

  replaceRelationships(replacements) {
    const { resource, targets, type } = replacements;
    const edgeOps = targets.map(target => ({
      operation: 'AddEdge',
      start: ref(resource),
      end: ref(target),
      type,
    })) as GraphOperation[];

    return [{ operation: 'RemoveEdgesOfType', vertex: ref(resource), type }, ...edgeOps];
  },

  appendRelationships(replacements) {
    const { resource, targets, type } = replacements;
    const edgeOps = targets.map(target => ({
      operation: 'AddEdge',
      start: ref(resource),
      end: ref(target),
      type: type,
    })) as GraphOperation[];

    return edgeOps;
  },

  deleteRelationship({ resource, type }) {
    return [{ operation: 'RemoveEdgesOfType', vertex: resource, type }];
  },

  deleteRelationships(x) {
    return this.deleteRelationship(x);
  },
};
