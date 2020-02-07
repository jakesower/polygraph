import { Schema } from '@polygraph/schema-utils';
import { mapObj } from '@polygraph/utils';
import { graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

export function generateGraphqlSchema(pgSchema: Schema) {
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
  const typeDefs = `${typeDefsStr} ${queryDefsStr}`;

  const resolvers = Object.keys(pgSchema.resources).reduce(
    (out, resName) => {
      const { singular, attributes, relationships } = pgSchema.resources[resName];
      const nextQuery = {
        ...out.Query,
        [resName]: () => ['placeholder'],
        [singular]: () => 'placeholder',
      };
      const placeholderAttrs = mapObj(attributes, () => () => 'placeholder');
      const placeholderRels = mapObj(relationships, rel =>
        rel.cardinality === 'many' ? () => ['placeholder'] : () => 'placeholder'
      );

      return {
        ...out,
        Query: nextQuery,
        [singular]: { ...placeholderAttrs, ...placeholderRels },
      };
    },
    { Query: {} }
  );

  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return makeExecutableSchema({
    typeDefs: `${typeDefsStr} ${queryDefsStr}`,
    resolvers: {
      Query: {
        bears: () => [['bears']],
        bear(id) {
          return {
            name: 'Tenderheart Bear',
          };
        },
        powers() {
          return {
            name: 'powah',
          };
        },
        power() {
          return {
            name: 'poo',
          };
        },
      },
      Power: {
        name: path =>
          [...path].reverse().reduce((out, path) => ({ [path]: { relationships: out } }), {}),
      },
      Bear: {
        // thinkin this needs to return something that has a "power" in it
        // name: (...args) => JSON.stringify(args, null, 2),
        powers: path => [[...path, 'powers']],
      },
    },
  });
}

export function runQuery(gqlSchema, query) {
  return graphql(gqlSchema, query);
}
