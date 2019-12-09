import { Query, Database, Result, Schema, Store } from './types';
// import { Schema } from '@polygraph/schema-utils';
import { appendKeys, uniq, unnest, mergeAll, mapObj } from '@polygraph/utils';
import { joinTableName } from '@polygraph/schema-utils';

export async function get(schema: Schema, db: Database, query: Query): Promise<Result> {
  const { query: q, params } = buildQuery(query);
  const results = await db.all(q, params);

  return buildResults(query, results);

  // Helpers

  function buildQuery(rootGraph: Query) {
    const go = (rawGraph: Query, path: (number | string)[]) => {
      const graph = { relationships: {}, ...rawGraph };
      const { attributes } = schema.resources[graph.type];
      const attrNames = Object.keys(attributes);
      const relationshipNames = Object.keys(graph.relationships);
      const table = `${path.join('$')}`;
      const kids = relationshipNames
        .map((relName, idx) => {
          const relDef = schema.resources[graph.type].relationships[relName];

          return go({ type: relDef.type, ...graph.relationships[relName] }, [...path, idx]);
        })
        .reduce(appendKeys, { selections: [], joins: [], constraints: [] });

      const joins = relationshipNames.map((rel, idx) =>
        join(graph.type, rel, table, `${table}$${idx}`)
      );
      // if (path.length === 1) throw kids;

      return appendKeys<{ [k: string]: any }, string>(kids, {
        selections: [
          `${table}.id AS ${table}$$id`,
          ...attrNames.map((attr, idx) => `${table}.${attr} AS ${table}$$${idx}`),
        ],
        joins,
        constraints: [],
        // constraints: graph.constraints.map(c => [`${table}.${c.field} = ?`, c.value]),
      });
    };

    const { selections, joins, constraints } = go(rootGraph, ['root']);

    joins.reverse();

    const constraintsWithId = rootGraph.id
      ? [...constraints, ['root$$id = ?', rootGraph.id]]
      : constraints;
    const fromStr = `FROM ${rootGraph.type} AS root`;
    const whereStr =
      constraintsWithId.length > 0 ? `WHERE ${constraintsWithId.map(c => c[0]).join(' AND ')}` : '';

    return {
      query: `SELECT ${selections.join(', ')} ${fromStr} ${joins.join(' ')} ${whereStr}`,
      params: constraintsWithId.map(c => c[1]),
    };
  }

  function buildResults(query: Query, results: { [k: string]: any }[]): Result {
    const tableTypeMap = (
      relQuery,
      table,
      type
    ): {
      [k: string]: {
        type: string;
        related: { name: string; table: string; cardinality: 'one' | 'many' }[];
      };
    } => {
      const relNames = Object.keys(relQuery.relationships || {});
      const related = relNames.map((relName, idx) => ({
        name: relName,
        table: `${table}$${idx}`,
        cardinality: schema.resources[type].relationships[relName].cardinality,
      }));

      return {
        [table]: { type, related },
        ...mergeAll(
          relNames.map((relName, idx) =>
            tableTypeMap(
              relQuery.relationships[relName],
              `${table}$${idx}`,
              schema.resources[type].relationships[relName].type
            )
          )
        ),
      };
    };

    const tableMap = tableTypeMap(query, 'root', query.type);
    const tableNames = Object.keys(tableMap);

    const extractTable = (row, table, curVal) => {
      const { type, related } = tableMap[table];

      if (curVal) {
        const relationships = related.reduce(
          (acc, { name, table, cardinality }) =>
            cardinality === 'many'
              ? {
                  ...acc,
                  [name]: [...curVal.relationships[name], row[`${table}$$id`]],
                }
              : { ...acc, [name]: row[`${table}$$id`] },
          curVal.relationships
        );

        return { ...curVal, relationships };
      }

      const attributes = mergeAll(
        Object.keys(schema.resources[type].attributes).map((attr, idx) => ({
          [attr]: row[`${table}$$${idx}`],
        }))
      );

      const relationships = mergeAll(
        related.map(({ name, table, cardinality }) => ({
          [name]: cardinality === 'one' ? row[`${table}$$id`] : [row[`${table}$$id`]],
        }))
      );

      return { attributes, relationships };
    };

    // Map from the table name in results to the resource type and related tables
    // e.g. { root: { type: 'bears', related: [root$0] }, root$0: { type: 'homes', related: [] } }
    let resources = uniq(Object.values(tableMap)).reduce(
      (acc, { type }) => ({
        ...acc,
        [type]: {},
      }),
      {}
    ) as { [k: string]: any };

    for (const row of results) {
      for (const table of tableNames) {
        const [type, id] = [tableMap[table].type, row[`${table}$$id`]];

        if (id) resources[type][id] = extractTable(row, table, resources[type][id]);
      }
    }

    // Expand the resources into a graph -- this can be extracted to a more general form
    const expand = (queryGraph, type, id) => {
      const resource = resources[type][id];

      if (!resource) return null;

      const relationships = mapObj(queryGraph.relationships || {}, (relGraph, relName) => {
        const relDef = schema.resources[type].relationships[relName];

        return relDef.cardinality === 'one'
          ? expand(relGraph, relDef.type, resource.relationships[relName])
          : uniq(resource.relationships[relName]).map(relId =>
              expand(relGraph, relDef.type, relId)
            );
      });

      return { type, id, attributes: resource.attributes, relationships };
    };

    return query.id
      ? results.length > 0
        ? expand(query, query.type, query.id)
        : null
      : uniq(results.map(r => r.root$$id)).map(id => expand(query, query.type, id));
  }

  function join(localType, localRelName, localTableName, foreignTableName) {
    const localDef = schema.resources[localType].relationships[localRelName];
    const foreignDef = schema.resources[localDef.type].relationships[localDef.inverse];
    const foreignType = localDef.type;
    const foreignRelName = localDef.inverse;

    if (localDef.cardinality === 'many' && foreignDef.cardinality === 'many') {
      const joinTable = joinTableName(localDef);
      const joinTableAlias = `${localTableName}$$$${foreignTableName}`;

      return `LEFT OUTER JOIN ${joinTable} AS ${joinTableAlias} ON ${localTableName}$$id = ${joinTableAlias}.${foreignDef.key}_id
              LEFT OUTER JOIN ${foreignType} AS ${foreignTableName} ON ${foreignTableName}$$id = ${joinTableAlias}.${localDef.key}_id`;
    }

    const base = `LEFT OUTER JOIN ${foreignType} AS ${foreignTableName} ON`;

    return localDef.cardinality === 'many'
      ? `${base} ${foreignTableName}.${foreignRelName}_id = ${localTableName}$$id`
      : `${base} ${localTableName}.${localRelName}_id = ${foreignTableName}$$id`;
  }
}
