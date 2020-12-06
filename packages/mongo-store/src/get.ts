import { Query, Database, Result, Schema, Store, SchemaRelationship } from './types';
// import { Schema } from '@polygraph/schema-utils';
import { appendKeys, uniq, unnest, mergeAll, mapObj, mapObjAsync, pick } from '@polygraph/utils';
import { joinTableName } from '@polygraph/schema-utils';

const attributeNamesForType = (schema: Schema, type: string): string[] => {
  return Object.keys(schema.resources[type].attributes);
};

const getInverse = (schema: Schema, relationship: SchemaRelationship) => {
  return schema.resources[relationship.type][relationship.inverse];
};

export async function get(schema: Schema, mongoose, initQuery: Query): Promise<Result> {
  if (initQuery.id) {
    const results = await step(initQuery, initQuery.type, { _id: initQuery.id }, 'one');

    return results || null;
  }

  return step(initQuery, initQuery.type, {}, 'many');

  async function step(query, type, joinCriteria: any, cardinality): Promise<Result> {
    const results = await mongoose.models[type].find(joinCriteria).lean();

    const relationships = await mapObjAsync(
      query.relationships || {},
      async (subQuery, relName) => {
        const relationship = schema.resources[type].relationships[relName];
        const join = buildJoin(query.type, results, relationship);

        return step(subQuery, relationship.type, join, relationship.cardinality);
      }
    );

    const formatItem = (rawItem: any): Result => ({
      type,
      id: rawItem._id.toString(),
      attributes: pick(rawItem, attributeNamesForType(schema, type)),
      relationships,
    });

    const formatted = results.map(formatItem);

    return cardinality === 'one' ? formatted[0] : formatted;
  }

  // if (query.id) {
  //   const result = await mongoose.models.bears.findById(query.id).lean();
  //   // mapObj(query.relationships, ())

  //   return result && formatItem(query.type, result);
  // }

  // const result = await mongoose.models.bears.find({}).lean();

  // return result.map(item => formatItem(query.type, item));

  // four possibilities for relationship lookups

  function buildJoin(type: string, nodes: any, relationship) {
    const inverse = getInverse(schema, relationship);
    return relationship.foreign_key
      ? { _id: { $in: nodes.map(node => node[relationship.foreign_key]) } }
      : relationship.foreign_keys
      ? { _id: { $in: nodes.flatMap(node => node[relationship.foreign_keys]) } }
      : inverse.foreign_key
      ? { [inverse.foreign_key]: { $in: nodes.map(node => node._id) } }
      : {}; // todo
  }
}
