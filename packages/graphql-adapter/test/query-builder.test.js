import test from 'ava';
import { buildQuery } from '../src/query-builder';
import { careBearsSchema } from '@polygraph/test-utils';

test('generate a search query for all bears', async t => {
  const compiled = await buildQuery(careBearsSchema, 'query { bears { name } }');

  t.deepEqual(compiled, {
    type: 'bears',
    attributes: ['name'],
    relationships: {},
  });
});

test('generate a search query for all bears with their home', async t => {
  const compiled = await buildQuery(careBearsSchema, 'query { bears { name home { name } } }');

  t.deepEqual(compiled, {
    type: 'bears',
    attributes: ['name'],
    relationships: { home: { attributes: ['name'], relationships: {} } },
  });
});

test('generate a search query for all bears with their homes, powers, and bears again', async t => {
  const compiled = await buildQuery(
    careBearsSchema,
    'query { bears { name home { name } powers { name bears { belly_badge } } } }'
  );

  t.deepEqual(compiled, {
    type: 'bears',
    attributes: ['name'],
    relationships: {
      home: { attributes: ['name'], relationships: {} },
      powers: {
        attributes: ['name'],
        relationships: {
          bears: {
            attributes: ['belly_badge'],
            relationships: {},
          },
        },
      },
    },
  });
});

test('generate a search query for a single bear', async t => {
  const compiled = await buildQuery(careBearsSchema, 'query { bear(id: "1") { name } }');

  t.deepEqual(compiled, {
    type: 'bears',
    id: '1',
    attributes: ['name'],
    relationships: {},
  });
});
