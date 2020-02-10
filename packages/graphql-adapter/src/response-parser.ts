import { Schema } from '@polygraph/schema-utils';
import { mapObj } from '@polygraph/utils';
import { graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

/**
 * This is the much more succinct sibling of the query builder. It's a
 * relatively straightforward operation to unwind the graph-like polygraph
 * response into a graphql response.
 */

export async function parseResponse(pgSchema: Schema, pgResponse: any, query: string) {
  const typeDefs = buildTypeDefs(pgSchema);
  const id = x => x;

  const resolvers = Object.keys(pgSchema.resources).reduce(
    (out, resName) => {
      const { singular, attributes, relationships } = pgSchema.resources[resName];
      const nextQuery = {
        ...out.Query,
        [resName]: id,
        [singular]: id,
      };
      const attrs = mapObj(attributes, attr => obj => obj.attributes[attr.key]);
      const rels = mapObj(relationships, rel => obj => obj.relationships[rel.key]);

      return {
        ...out,
        Query: nextQuery,
        [singular]: { ...attrs, ...rels },
      };
    },
    { Query: {} }
  );

  const gqlSchema = makeExecutableSchema({ typeDefs, resolvers });
  const result = await graphql(gqlSchema, query, pgResponse);

  if (result.errors) {
    throw result.errors;
  }

  return result.data;
}

function buildTypeDefs(pgSchema: Schema) {
  const relType = (relDef, relName) => {
    const [ob, cb] = relDef.cardinality === 'one' ? ['', ''] : ['[', ']'];
    const type = pgSchema.resources[relDef.type].singular;

    return `${relName}: ${ob}${type}${cb}`;
  };

  const typeDefsObj = mapObj(
    pgSchema.resources,
    def => `
      type ${def.singular} {
        ${Object.keys(def.attributes)
          .map(k => `${k}: String`) // TODO: read the schema better!
          .join('\n')}
        ${Object.values(mapObj(def.relationships, relType)).join('\n')}
      }
    `
  );
  const typeDefsStr = Object.values(typeDefsObj).join(' ');
  const queryDefs = Object.values(pgSchema.resources).map(
    type => `
      ${type.key}: [${type.singular}]
      ${type.singular}(id: String): ${type.singular}
    `
  );
  const queryDefsStr = `type Query { ${queryDefs.join(' ')} }`;
  return `${typeDefsStr} ${queryDefsStr}`;
}
