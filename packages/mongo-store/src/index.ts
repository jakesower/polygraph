import {
  Database,
  Schema,
  Store,
  ResourceGraph,
  SchemaResource,
  SchemaRelationship,
  RelationshipReplacement,
} from './types';
import { BaseStore } from '@polygraph/core';
import { get } from './get';
import { pick } from '@polygraph/utils';
import { joinTableName } from '@polygraph/schema-utils';

export function MongoStore(schema: Schema, mongoose) {
  const base = BaseStore(schema);

  return {
    ...base,
    get: query => get(schema, mongoose, query),
  };
}
