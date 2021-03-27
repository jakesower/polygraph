import { Schema } from '@polygraph/schema-utils';
/**
 * A word of explanation because this is not intuitive code. Graphql's
 * architecture means that it walks out and executes resolvers. There is only a
 * notion of "out" and not back "in" when executing a query. That is, once a
 * node has been visited, that's it. There's no going back to reflect on what
 * child nodes have returned.
 *
 * This works fine when we have actual results to navigate. Where it's not okay
 * is when we're trying to build the polygraph query. There are three elements:
 *
 * - Attributes
 * - Relationships
 * - Conditions
 *
 * Each of these must be collected, rather than merely resolved.
 *
 * I solve this problem by creating a function-level variable that gets built
 * out as graphql walks the graph.
 *
 * There is certainly a more elegant way of doing this with the graphql AST,
 * but I have absolutely no desire to go down that rabbit hole. I love graphql
 * query syntax, but that's all I like about it.
 *
 * That said, dear reader, please feel free to refactor this nonsense! Let the
 * tests be your guide.
 */
export declare function buildQuery(pgSchema: Schema, query: string): Promise<any>;
