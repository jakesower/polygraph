import { NormalizedDataGraph } from '@polygraph/data-graph';
import { Schema, Store, Query } from './types';
import {
  flatten,
  mapObj,
  applyOrMap,
  indexOn,
  pathOr,
  forEachObj,
  omitKeys,
} from '@polygraph/utils';
import { RelationshipReplacement } from '@polygraph/data-graph/dist/types';

export function JsonApiStore(schema: Schema, transport: any): Store {
  // these lines are due to a flaw in axios that requires setting headers here
  transport.defaults.headers['Accept'] = 'application/vnd.api+json';
  transport.defaults.headers['Content-Type'] = 'application/vnd.api+json';

  async function getOne(query: Query): Promise<any> {
    const { type, id } = query;
    const params = getParams(query);

    const response = await transport.get(`/${type}/${id}`, {
      params,
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
    });

    if (response.status === 404) return null;

    const data = response.data.data;
    const included = response.data.included || [];

    const resources = keyResources([data, ...included]);

    const dataGraph = NormalizedDataGraph(
      {
        root: data,
        resources,
      },
      query
    );

    return dataGraph.base().root;
  }

  async function getMany(query: Query) {
    const response = await transport.get(`/${query.type}`, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
    });

    const data = response.data.data;
    const included = response.data.included || [];

    const resources = keyResources([...data, ...included]);

    const dataGraph = NormalizedDataGraph(
      {
        root: data,
        resources,
      },
      query
    );

    return dataGraph.base().root;
  }

  function keyResources(resources) {
    const extractRels = resource => mapObj(resource.relationships, (r: any) => r.data);

    return resources.reduce((resources, resource) => {
      const { type, id } = resource;
      const extracted = resource.relationships
        ? { ...resource, relationships: extractRels(resource) }
        : resource;

      if (!(type in resources)) {
        return { ...resources, [type]: { [id]: extracted } };
      }

      return { ...resources, [type]: { ...resources[type], [id]: extracted } };
    }, {});
  }

  function getParams(query) {
    // include
    const getInclude = (node, accum) =>
      node.relationships
        ? Object.keys(node.relationships).map(r => getInclude(node.relationships[r], [...accum, r]))
        : accum.join('.');

    const include = flatten(getInclude(query, []));

    return {
      ...(include.length > 0 ? { include: include.join(',') } : {}),
    };
  }

  return {
    get: async function(query) {
      return query.id ? getOne(query) : getMany(query);
    },

    // TODO
    merge: async function(rawGraph) {
      // it ain't pretty, but it's what you get when demanding create and
      // update seperately; caching could mitigate significantly, but this is a
      // function worth avoiding on this adapter
      // throw referenceRelationships(rawGraph);
      const resourceRefs = flattenGraph(rawGraph);
      const existingResourceGraphs = await Promise.all(
        resourceRefs.map(ref => getOne({ id: ref.id, type: ref.type }))
      );
      const existingResources = existingResourceGraphs.filter(x => x !== null);
      const existingIndex = indexOn(existingResources, ['type', 'id']);

      // TODO: Filter dup updates
      const modifications = resourceRefs.map(resource =>
        pathOr(existingIndex, [resource.type, resource.id], false)
          ? this.update(resource)
          : this.create(resource)
      );

      return Promise.all(modifications);
    },

    create: async function(resource) {
      const rDefs = schema.resources[resource.type].relationships;
      const data = {
        type: resource.type,
        id: resource.id,
        attributes: resource.attributes,
        relationships: mapObj(resource.relationships || {}, (rel, relName) => ({
          data: { type: rDefs[relName].type, id: rel },
        })),
      };

      return transport.post(`/${resource.type}`, { data });
    },

    update: async function(resource) {
      const rDefs = schema.resources[resource.type].relationships;
      const data = {
        type: resource.type,
        id: resource.id,
        attributes: resource.attributes || {},
        relationships: mapObj(resource.relationships || {}, (rel, relName) => ({
          data: applyOrMap(rel, id => ({ type: rDefs[relName].type, id })),
        })),
      };

      return transport.patch(`/${resource.type}/${resource.id}`, { data });
    },

    delete: async function(resource) {
      return transport.delete(`/${resource.type}/${resource.id}`);
    },

    replaceRelationship: async function(replacement) {
      const { type, id, relationship, foreignId } = replacement;
      const rDef = schema.resources[replacement.type].relationships[relationship];

      const data = applyOrMap(foreignId, id => ({ type: rDef.type, id }));

      return transport.patch(`/${type}/${id}/relationships/${relationship}`, { data });
    },

    replaceRelationships: async function(replacement) {
      return this.replaceRelationship({ ...replacement, foreignId: replacement.foreignIds });
    },

    appendRelationships: async function(extraRelationships) {
      const { type, id, relationship, foreignIds } = extraRelationships;
      const rDef = schema.resources[extraRelationships.type].relationships[relationship];

      const data = foreignIds.map(id => ({ type: rDef.type, id }));

      return transport.post(`/${type}/${id}/relationships/${relationship}`, { data });
    },

    deleteRelationship: async function({ type, id, relationship }) {
      return transport.patch(`/${type}/${id}/relationships/${relationship}`, { data: null });
    },

    deleteRelationships: async function({ type, id, relationship, foreignIds }) {
      const rDef = schema.resources[type].relationships[relationship];
      const data = foreignIds.map(id => ({ type: rDef.type, id }));

      // the double wrapped data is on axios... :(
      return transport.delete(`/${type}/${id}/relationships/${relationship}`, { data: { data } });
    },
  };

  function flattenGraph(fullGraph) {
    const rDefs = schema.resources[fullGraph.type].relationships;

    let out = [fullGraph];

    forEachObj(fullGraph.relationships || {}, (relResources, relName) => {
      const ary = Array.isArray(relResources) ? relResources : [relResources];

      ary
        .map(id => ({ type: rDefs[relName].type, id }))
        .map(flattenGraph)
        .forEach(d => {
          out = [...out, ...d];
        });
    });

    return out;
  }
}
