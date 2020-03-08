export function FortuneStore(schema, fortuneStore) {
  return {
    get,
    merge,
    update,
    create,
    delete: delete_,
    appendRelationships,
    replaceRelationship: args => replaceRelationships({ ...args, foreignIds: [args.foreignId] }),
    replaceRelationships,
    deleteRelationship,
    deleteRelationships,
  };

  // Main actions

  function get(query) {
    if ('id' in query) {
      return fortuneStore
        .find(query.type, [query.id])
        .then(r => r.payload.records[0])
        .then(r => separate(query.type, r))
        .catch(() => null);
    }

    return fortuneStore
      .find(query.type)
      .then(r => r.payload.records)
      .then(rs => rs.map(r => separate(query.type, r)));
  }

  // As of now, support the same stuff that JSONAPI supports. Namely, only a
  // single object can be touched in a merge call. This should be revisited.
  function merge(resource) {
    const { id } = resource;
    return id ? update(resource) : create(resource);
  }

  function create(resource) {
    const { type } = resource;
    return fortuneStore.create(type, [flat(resource)]);
  }

  function update(resource) {
    const { id, type } = resource;
    return fortuneStore.update(type, [{ id, replace: flat(resource) }]);
  }

  function delete_(resource) {
    const { id, type } = resource;
    return fortuneStore.delete(type, [{ id }]);
  }

  function appendRelationships({ type, id, foreignIds, relationship: relationshipName }) {
    return fortuneStore.update(type, { id, push: { [relationshipName]: foreignIds } });
  }

  function replaceRelationships({ type, id, foreignIds, relationship: relationshipName }) {
    return fortuneStore.update(type, id, { replace: { [relationshipName]: foreignIds } });
  }

  function deleteRelationship({ type, id, relationship: relationshipName }) {
    return fortuneStore.update(type, id, { replace: { [relationshipName]: [] } });
  }

  function deleteRelationships({ type, id, foreignIds, relationship: relationshipName }) {
    return fortuneStore.update(type, id, { pull: { [relationshipName]: foreignIds } });
  }

  function flat(resource) {
    return { id: resource.id, ...(resource.attributes || {}), ...(resource.relationships || {}) };
  }

  function separate(type, result) {
    let out = { type, id: result.id, attributes: {}, relationships: {} };
    const def = schema.resources[type];

    Object.keys(def.attributes).forEach(attrName => (out.attributes[attrName] = result[attrName]));

    return out;
  }
}

export function schemaToFortune(schema) {
  const typeMap = {
    string: String,
    number: Number,
    text: String,
  };

  let out = {};

  const resources = Object.keys(schema.resources);
  resources.forEach(resourceName => {
    out[resourceName] = {};

    const def = schema.resources[resourceName];

    Object.keys(def.attributes).forEach(attrName => {
      out[resourceName][attrName] = typeMap[def.attributes[attrName].type];
    });

    Object.keys(def.relationships).forEach(relName => {
      const rel = def.relationships[relName];
      out[resourceName][relName] =
        rel.cardinality === 'many' ? [Array(rel.type), rel.inverse] : [rel.type, rel.inverse];
    });
  });

  return out;
}
