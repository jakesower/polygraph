import test from 'ava';
import { readFileSync } from 'fs';
import { generateGraphqlSchema } from '../src';
import { expandSchema } from '@polygraph/schema-utils';

const rawSchema = readFileSync(__dirname + '/care-bear-schema.json', { encoding: 'utf8' });
const schema = expandSchema(JSON.parse(rawSchema));

test('compiles without puking', t => {
  generateGraphqlSchema(schema);
  t.deepEqual(1, 1);
});
