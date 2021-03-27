import { Schema } from '@polygraph/schema-utils';

export function makeCache(schema: Schema, init) {
  const emptyCache = () =>
    Object.keys(schema.resources).reduce(
      (acc, resourceName) => ({ ...acc, [resourceName]: {} }),
      {}
    );

  let cache = { ...emptyCache(), ...init };

  return {
    clear() {
      cache = emptyCache();
    },

    get(type, id) {
      return cache[type][id];
    },

    has(type, id) {
      return id in cache[type];
    },

    set(type, id, val) {
      cache[type][id] = val;
    },
  };
}
