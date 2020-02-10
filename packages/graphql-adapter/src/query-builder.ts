import { Schema } from '@polygraph/schema-utils';
import { mapObj } from '@polygraph/utils';
import { graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

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

export async function buildQuery(pgSchema: Schema, query: string) {
  let outputQuery: any = {};

  const typeDefs = buildTypeDefs(pgSchema);

  // slurps are what pull the info we care about into the context
  const slurpAttribute = (path, args, ctx, info) => {
    appendPath(outputQuery, [...path, 'attributes'], info.fieldName);

    return info.fieldName;
  };

  const slurpRelationship = rel => (path, args, ctx) => {
    const next = [...path, 'relationships', rel.key];
    setPath(outputQuery, next, {
      relationships: {},
      attributes: [],
    });

    return rel.cardinality === 'many' ? [next] : next;
  };

  const resolvers = Object.keys(pgSchema.resources).reduce(
    (out, resName) => {
      const { singular, attributes, relationships } = pgSchema.resources[resName];
      const nextQuery = {
        ...out.Query,
        // the top level query initializes the context, then passes an empty path to the
        // resource resolver
        [resName]: () => {
          outputQuery = {
            type: resName,
            attributes: [],
            relationships: {},
          };

          return [[]];
        },
        [singular]: (_, args) => {
          outputQuery = {
            type: resName,
            id: args.id,
            attributes: [],
            relationships: {},
          };

          return [];
        },
      };
      const placeholderAttrs = mapObj(attributes, () => slurpAttribute);
      const placeholderRels = mapObj(relationships, slurpRelationship);

      return {
        ...out,
        Query: nextQuery,
        [singular]: { ...placeholderAttrs, ...placeholderRels },
      };
    },
    { Query: {} }
  );

  const gqlSchema = makeExecutableSchema({ typeDefs, resolvers });
  const result = await graphql(gqlSchema, query);

  if (result.errors) {
    throw result.errors;
  }

  return outputQuery;
}

function appendPath(obj, path, val) {
  const [head, ...tail] = path;
  if (tail.length === 0) {
    obj[head].push(val);
    return;
  }

  appendPath(obj[head], tail, val);
}

function setPath(obj, path, val) {
  const [head, ...tail] = path;
  if (tail.length === 0) {
    obj[head] = val;
    return;
  }

  setPath(obj[head], tail, val);
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
          .map(k => `${k}: String`) // map everything to a string for placeholding purposes
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
