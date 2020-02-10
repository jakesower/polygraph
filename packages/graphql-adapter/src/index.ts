import { buildQuery } from './query-builder';
import { parseResponse } from './response-parser';
import { Schema } from '@polygraph/schema-utils';

export async function polygraphql(schema: Schema, polygraphStore: any, query: string) {
  const built = await buildQuery(schema, query);
  const response = polygraphStore.query(built);

  return parseResponse(schema, response, query);
}
