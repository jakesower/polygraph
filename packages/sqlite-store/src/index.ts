import {
  Database,
  Schema,
  Store,
  ResourceGraph,
  SchemaResource,
  SchemaRelationship,
  RelationshipReplacement,
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
    replaceRelationship: async function(replacement: RelationshipReplacement): Promise<any> {
      const sql = `UPDATE ${replacement.type} SET ${replacement.relationship}_id = ? WHERE id = ?`;
      const params = [replacement.foreignId, replacement.id];

      return db.run(sql, params);
    },
    replaceRelationships: async function(replacement) {
      const rel = schema.resources[replacement.type].relationships[replacement.relationship];

      const deleteSql = `UPDATE ${rel.type} SET ${rel.inverse}_id = NULL WHERE ${rel.inverse}_id = ?`;
      const deleteParams = [replacement.id];

      await db.run(deleteSql, deleteParams);

      const addSql = `UPDATE ${rel.type} SET ${
        rel.inverse
      }_id = ? WHERE id IN (${replacement.foreignIds.map(_ => '?').join(',')})`;
      const addParams = [replacement.id, ...replacement.foreignIds];

      return db.run(addSql, addParams);
    },
    appendRelationships: async function(replacement) {
      const rel = schema.resources[replacement.type].relationships[replacement.relationship];
      const addSql = `UPDATE ${rel.type} SET ${
        rel.inverse
      }_id = ? WHERE id IN (${replacement.foreignIds.map(_ => '?').join(',')})`;
      const addParams = [replacement.id, ...replacement.foreignIds];

      return db.run(addSql, addParams);
    },
    deleteRelationship: async function({ type, id, relationship }) {
      // const rel = schema.resources[type].relationships[relationship];

      const sql = `UPDATE ${type} SET ${relationship}_id = NULL WHERE id = ?`;
      const params = [id];

      return db.run(sql, params);
    },
    deleteRelationships: function({ type, id, relationship: relName, foreignIds }) {
      const rel = schema.resources[type].relationships[relName];

      const sql = `UPDATE ${rel.type} SET ${rel.inverse}_id = NULL WHERE id IN (${foreignIds
        .map(_ => '?')
        .join(',')})`;
      const params = foreignIds;

      return db.run(sql, params);
    },
  };

  function partitionRelationships(resource: SchemaResource) {
    // TODO: Add symmetric as a choice
    const init = {
      symmetric: <{ [k: string]: SchemaRelationship }>{},
      local: <{ [k: string]: SchemaRelationship }>{},
      manyToOne: <{ [k: string]: SchemaRelationship }>{},
      manyToMany: <{ [k: string]: SchemaRelationship }>{},
    };
    return Object.keys(resource.relationships).reduce((acc, relName) => {
      const rel = resource.relationships[relName];
      const type = relationshipType(rel);

      return { ...acc, [type]: { ...acc[type], [relName]: rel } };
    }, init);
  }

  function relationshipType(
    relationship: SchemaRelationship
  ): 'local' | 'manyToOne' | 'manyToMany' | 'symmetric' {
    const inverse = schema.resources[relationship.type].relationships[relationship.inverse];
    const symmetric = relationship.key === inverse.key && relationship.type === inverse.type;

    return symmetric
      ? 'symmetric'
      : relationship.cardinality === 'one'
      ? 'local'
      : inverse.cardinality === 'one'
      ? 'manyToOne'
      : 'manyToMany';
  }
}
