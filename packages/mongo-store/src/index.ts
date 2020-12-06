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

export function MongoStore(schema: Schema, mongoose) {
  return {
    get: query => get(schema, mongoose, query),
  };
}
