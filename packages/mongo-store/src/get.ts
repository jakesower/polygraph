import { Query, Database, Result, Schema, Store, SchemaRelationship } from './types';
import { BaseStore } from '@polygraph/core';
// import { Schema } from '@polygraph/schema-utils';
import { appendKeys, uniq, unnest, mergeAll, mapObj, mapObjAsync, pick } from '@polygraph/utils';
import { joinTableName } from '@polygraph/schema-utils';

const attributeNamesForType = (schema: Schema, type: string): string[] => {
  return Object.keys(schema.resources[type].attributes);
};

const getInverse = (schema: Schema, relationship) => {
  return schema.resources[relationship.type].relationships[relationship.inverse];
};

export async function get(schema: Schema, mongoose, initQuery: Query): Promise<Result> {
  // const x = await mongoose.models['bears']
  //   .find({})
  //   .populate({ path: 'home', populate: { path: 'bears' } })
  //   .lean();
  // console.log(x);
  // return x;

  // const x = await mongoose.models.bears
  //   .find({
  //     home: new mongoose.Types.ObjectId('5fc2f8eabdbcca10e1fbc451') },
  //   })
  //   .orFail();
  // console.log(x);
  // return x;

  const base = BaseStore(schema);

  if (initQuery.id) {
    const results = await step(initQuery, initQuery.type, { _id: initQuery.id }, 'one');

    return results || null;
  }

  return step(initQuery, initQuery.type, {}, 'many');

  async function step(query, type, joinCriteria: any, cardinality): Promise<Result> {
    const rawResults = await mongoose.models[type].find(joinCriteria).lean().orFail();
    const rawResultAttrs = rawResults.map(rawItem => ({
      id: rawItem._id.toString(),
      attributes: pick(rawItem, attributeNamesForType(schema, type)),
      type,
    }));

    const results = base.filter(rawResultAttrs, query.filter);

    const relationships = await mapObjAsync(
      query.relationships || {},
      async (subQuery, relName) => {
        const relationship = schema.resources[type].relationships[relName];
        const join = buildJoin(rawResults, relationship);

        return step(subQuery, relationship.type, join, relationship.cardinality);
      }
    );

    const formatted = results.map(result => ({ ...result, relationships }));

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

  function buildJoin(nodes: any, relationship) {
    const inverse = getInverse(schema, relationship);
    return relationship.foreign_key
      ? { _id: { $in: nodes.map(node => node[relationship.foreign_key]) } }
      : relationship.foreign_keys
      ? { _id: { $in: nodes.flatMap(node => node[relationship.foreign_keys]) } }
      : inverse.foreign_key
      ? { [inverse.foreign_key]: { $in: nodes.map(node => node._id.toString()) } }
      : {}; // todo
  }
}
