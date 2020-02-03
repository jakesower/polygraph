import { Schema } from '@polygraph/schema-utils';
import { mapObj } from '@polygraph/utils';
// import { parse, print } from 'graphql/language';
import { buildSchema } from 'graphql';

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
          .map(k => `${k}: String`)
          .join('\n')}
        ${Object.values(mapObj(def.relationships, relType)).join(' ')}
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
  // throw `${typeDefsStr} ${queryDefsStr}`;

  // Pretty it up for errors?
  return buildSchema(`${typeDefsStr} ${queryDefsStr}`);
}

export function generateQuery(query) {
  return 'hi';
}
