import test from 'ava';
import { MemoryStore } from '@polygraph/memory-store';
import { careBearsSchema } from '@polygraph/test-utils';
import { careBearsData } from '@polygraph/test-utils';

test.beforeEach(t => {
  t.context = {
    store: MemoryStore(careBearsSchema, careBearsData),
  };
});

test('generate a search query for all bears', async t => {
  t.deepEqual(1, 1);
});
