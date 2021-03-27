import { parse } from './parse';

const relationshipObjs = query => Object.values(query.relationships);

const everyQuery = (query, fn) =>
  fn(query) ? Object.values(query.relationships).every(q => everyQuery(q, fn)) : false;

const flattenQuery = queryNode => [queryNode, ...Object.values(queryNode.relationships)];

export function compile(schema, pgqlStr) {
  const parsed = parse(pgqlStr);
  const resourceNames = Object.values(schema.resources);
  const flattened = flattenQuery(parsed);

  if (flattened.some(({ type }) => !resourceNames.includes(type))) {
    throw new SyntaxError(`${type} is not a resource defined in the schema`);
  }
}
