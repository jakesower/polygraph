import test from 'ava';
import { runQuery, generateGraphqlSchema } from '../src';
import { MemoryStore } from '@polygraph/memory-store';
import { careBearsSchema } from '@polygraph/test-utils';
import { careBearsData } from '@polygraph/test-utils';

const gqlSchema = generateGraphqlSchema(careBearsSchema);

test.beforeEach(t => {
  t.context = {
    store: MemoryStore(careBearsSchema, careBearsData),
  };
});

test('generate a search query for all bears', async t => {
  const compiled = await runQuery(gqlSchema, 'query { bears { name powers { name } } }');

  // if (compiled.errors) {
  //   throw compiled.errors[0];
  // }

  t.deepEqual(compiled.errors, undefined);

  throw JSON.stringify(compiled);

  t.deepEqual(compiled, {
    type: 'bears',
  });
});
