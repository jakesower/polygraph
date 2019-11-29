import { Database, Schema, Store } from './types';
import { get } from './get';

export function SqliteStore(schema: Schema, db: Database): Store {
  return {
    get: query => get(schema, db, query),
    merge: async function(graph) {
      const def = schema.resources[graph.type];
      const attrColumnNames = Object.keys(def.attributes);
      const localRels = Object.values(def.relationships).filter(rel => rel.cardinality === 'one');
      const columnNames = ['id', ...attrColumnNames, ...localRels.map(rel => `${rel.key}_id`)];

      const sql = `INSERT INTO ${graph.type} (${columnNames.join(',')}) VALUES(${columnNames
        .map(_ => '?')
        .join(',')})`;
      const params = [
        graph.id,
        ...attrColumnNames.map(attr => graph.attributes[attr]),
        ...localRels.map(rel => graph.relationships[rel.key]),
      ];

      return db.run(sql, params);
    },
  };
}
