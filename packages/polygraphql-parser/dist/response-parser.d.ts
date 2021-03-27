import { Schema } from '@polygraph/schema-utils';
/**
 * This is the much more succinct sibling of the query builder. It's a
 * relatively straightforward operation to unwind the graph-like polygraph
 * response into a graphql response.
 */
export declare function parseResponse(pgSchema: Schema, pgResponse: any, query: string): Promise<any>;
