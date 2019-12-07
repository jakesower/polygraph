import {
  Database,
  Schema,
  Store,
  ResourceGraph,
  SchemaResource,
  SchemaRelationship,
} from './types';
import { get } from './get';
import { pick } from '@polygraph/utils';
import { joinTableName } from '@polygraph/schema-utils';

export function SqliteStore(schema: Schema, db: Database): Store {
  return {
    get: query => get(schema, db, query),
    merge: async function(rawGraph: ResourceGraph) {
      const graph = { attributes: {}, relationships: {}, ...rawGraph };
      const def = schema.resources[graph.type];

      // upsert logic is confusing, so just gonna roll with an extra query
      // a refactor to minimize queries wouldn't be a bad idea
      const existing = await db.get(`SELECT * FROM ${graph.type} WHERE id=?`, [graph.id]);

      if (!existing) {
        // insert
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
      }

      // update
      const attrs = pick(graph.attributes, Object.keys(def.attributes));
      const localRels = pick(
        graph.relationships,
        Object.keys(def.relationships).filter(rk => def.relationships[rk].cardinality === 'one')
      );
      const values = { ...attrs, ...localRels };
      const columnNames = [...Object.keys(attrs), ...Object.keys(localRels).map(r => `${r}_id`)];

      const { manyToOne, manyToMany } = partitionRelationships(schema.resources[graph.type]);

      // TODO: Make into a transaction
      const localQuery =
        columnNames.length > 0
          ? (function() {
              const sql = `UPDATE ${graph.type} SET ${columnNames.map(v => `${v} = ?`).join(',')}`;
              const params = Object.values(values);

              return db.run(sql, params);
            })()
          : Promise.resolve();

      const foreignOneRels = pick(graph.relationships, Object.keys(manyToOne));
      const foreignOneQueries = Object.keys(foreignOneRels).map(async relName => {
        const rel = def.relationships[relName];

        const removeSql = `UPDATE ${rel.type} SET ${rel.inverse}_id = NULL WHERE ${rel.inverse}_id = ?`;
        const removeParams = [graph.id];
        await db.run(removeSql, removeParams);

        const keepSql = `UPDATE ${rel.type} SET ${
          rel.inverse
        }_id = ? WHERE id IN (${graph.relationships[rel.key].map(_ => '?').join(',')})`;
        const keepParams = [graph.id, ...graph.relationships[rel.key]];
        return await db.run(keepSql, keepParams);
      });

      const foreignManyRels = pick(graph.relationships, Object.keys(manyToMany));
      const foreignManyQueries = Object.keys(foreignManyRels).map(async relName => {
        const rel = def.relationships[relName];
        const jt = joinTableName(rel);

        const removeSql = `DELETE FROM ${jt} WHERE ${rel.key}_id = ?`;
        const removeParams = [graph.id];
        await db.run(removeSql, removeParams);

        const insertQueries = graph.relationships[rel.key].map(relId => {
          const keepSql = `INSERT INTO ${jt} (${rel.inverse}_id, ${rel.key}_id) VALUES (?, ?)`;
          const keepParams = [graph.id, relId];
          return db.run(keepSql, keepParams);
        });

        return await Promise.all(insertQueries);
      });

      return await Promise.all([localQuery, ...foreignOneQueries, ...foreignManyQueries]);
    },
    delete: async function(graph: ResourceGraph) {
      const localQuery = db.run(`DELETE FROM ${graph.type} WHERE id = ?`, graph.id);

      const { manyToOne, manyToMany } = partitionRelationships(schema.resources[graph.type]);

      const manyToOneQueries = Object.values(manyToOne).map(rel => {
        const removeSql = `UPDATE ${rel.type} SET ${rel.inverse}_id = NULL WHERE ${rel.inverse}_id = ?`;
        const removeParams = [graph.id];
        return db.run(removeSql, removeParams);
      });

      const manyToManyQueries = Object.values(manyToMany).map(rel => {
        const jt = joinTableName(rel);
        const removeSql = `DELETE FROM ${jt} WHERE ${rel.key}_id = ?`;
        const removeParams = [graph.id];

        return db.run(removeSql, removeParams);
      });

      return await Promise.all([localQuery, ...manyToOneQueries, ...manyToManyQueries]);
    },
  };

  function partitionRelationships(resource: SchemaResource) {
    // TODO: Add symmetric as a choice
    const init = {
      local: <{ [k: string]: SchemaRelationship }>{},
      manyToOne: <{ [k: string]: SchemaRelationship }>{},
      manyToMany: <{ [k: string]: SchemaRelationship }>{},
    };
    return Object.keys(resource.relationships).reduce((acc, relName) => {
      const rel = resource.relationships[relName];
      const inverse = schema.resources[rel.type].relationships[rel.inverse];
      const type =
        rel.cardinality === 'one'
          ? 'local'
          : inverse.cardinality === 'one'
          ? 'manyToOne'
          : 'manyToMany';

      return { ...acc, [type]: { ...acc[type], [relName]: rel } };
    }, init);
  }
}
