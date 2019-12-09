import test from 'ava';
import { expandSchema } from '@polygraph/schema-utils';
import { readFileSync } from 'fs';
import { SqliteStore } from '../src';
import sqlite from 'sqlite';

const rawSchema = readFileSync(__dirname + '/care-bear-schema.json', { encoding: 'utf8' });
const schema = expandSchema(JSON.parse(rawSchema));

const grumpyBear = {
  type: 'bears',
  id: '4',
  attributes: {
    name: 'Grumpy Bear',
    gender: 'male',
    belly_badge: 'raincloud',
    fur_color: 'blue',
  },
  relationships: {
    home: '1',
  },
};

const attrs = {
  bears: {
    1: {
      name: 'Tenderheart Bear',
      gender: 'male',
      belly_badge: 'heart',
      fur_color: 'tan',
    },
    2: {
      name: 'Cheer Bear',
      gender: 'female',
      belly_badge: 'rainbow',
      fur_color: 'carnation pink',
    },
    3: {
      name: 'Wish Bear',
      gender: 'female',
      belly_badge: 'shooting star',
      fur_color: 'turquoise',
    },
    5: {
      name: 'Wonderheart Bear',
      gender: 'female',
      belly_badge: 'three hearts',
      fur_color: 'pink',
    },
  },
  homes: {
    1: {
      name: 'Care-a-Lot',
      location: 'Kingdom of Caring',
      caring_meter: 1,
    },
    2: { name: 'Forest of Feelings', location: 'Kingdom of Caring', caring_meter: 1 },
  },
  powers: {
    careBearStare: {
      name: 'Care Bear Stare',
      description: 'Purges evil.',
    },
    makeWish: {
      name: 'Make a Wish',
      description: 'Makes a wish on Twinkers',
    },
  },
};

test.beforeEach(async t => {
  const db = await sqlite.open(':memory:');

  await db.run(
    'CREATE TABLE bears (id VARCHAR, name VARCHAR, gender VARCHAR, belly_badge VARCHAR, fur_color VARCHAR, home_id VARCHAR, best_friend_id VARCHAR)'
  );
  await db.run(
    'CREATE TABLE homes (id VARCHAR, name VARCHAR, location VARCHAR, caring_meter REAL)'
  );
  await db.run('CREATE TABLE powers (id VARCHAR, name VARCHAR, description VARCHAR)');
  await db.run('CREATE TABLE bears_powers (bears_id VARCHAR, powers_id VARCHAR)');

  await db.run(
    "INSERT INTO bears VALUES ('1', 'Tenderheart Bear', 'male', 'heart', 'tan', '1', '')"
  );
  await db.run(
    "INSERT INTO bears VALUES ('2', 'Cheer Bear', 'female', 'rainbow', 'carnation pink', '1', '3')"
  );
  await db.run(
    "INSERT INTO bears VALUES ('3', 'Wish Bear', 'female', 'shooting star', 'turquoise', '1', '2')"
  );
  await db.run(
    "INSERT INTO bears VALUES ('5', 'Wonderheart Bear', 'female', 'three hearts', 'pink', '', '')"
  );

  await db.run("INSERT INTO homes VALUES ('1', 'Care-a-Lot', 'Kingdom of Caring', 1)");
  await db.run("INSERT INTO homes VALUES ('2', 'Forest of Feelings', 'Kingdom of Caring', 1)");

  await db.run("INSERT INTO powers VALUES ('careBearStare', 'Care Bear Stare', 'Purges evil.')");
  await db.run("INSERT INTO powers VALUES ('makeWish', 'Make a Wish', 'Makes a wish on Twinkers')");

  await db.run("INSERT INTO bears_powers VALUES ('1', 'careBearStare')");
  await db.run("INSERT INTO bears_powers VALUES ('2', 'careBearStare')");
  await db.run("INSERT INTO bears_powers VALUES ('3', 'careBearStare')");

  t.context = { store: SqliteStore(schema, db) };
});

test('fetches a single resource', async t => {
  const result = await t.context.store.get({ type: 'bears', id: '1' });

  t.deepEqual(result, {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {},
  });
});

test('does not fetch a nonexistent resource', async t => {
  const result = await t.context.store.get({ type: 'bears', id: '6' });

  t.deepEqual(result, null);
});

test('fetches multiple resources', async t => {
  const result = await t.context.store.get({ type: 'bears' });

  t.deepEqual(result, [
    {
      type: 'bears',
      id: '1',
      attributes: attrs.bears['1'],
      relationships: {},
    },
    {
      type: 'bears',
      id: '2',
      attributes: attrs.bears['2'],
      relationships: {},
    },
    {
      type: 'bears',
      id: '3',
      attributes: attrs.bears['3'],
      relationships: {},
    },
    {
      type: 'bears',
      id: '5',
      attributes: attrs.bears['5'],
      relationships: {},
    },
  ]);
});

test('fetches a single resource with a single relationship', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: { home: {} },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {
      home: {
        type: 'homes',
        id: '1',
        attributes: attrs.homes['1'],
        relationships: {},
      },
    },
  });
});

test('fetches a single resource with many-to-many relationship', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: { powers: {} },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {
      powers: [
        {
          type: 'powers',
          id: 'careBearStare',
          attributes: attrs.powers['careBearStare'],
          relationships: {},
        },
      ],
    },
  });
});

test('fetches multiple relationships of various types', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: {
      home: {
        relationships: {
          bears: {},
        },
      },
      powers: {},
    },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {
      home: {
        type: 'homes',
        id: '1',
        attributes: attrs.homes['1'],
        relationships: {
          bears: [
            {
              type: 'bears',
              id: '1',
              attributes: attrs.bears['1'],
              relationships: {},
            },
            {
              type: 'bears',
              id: '2',
              attributes: attrs.bears['2'],
              relationships: {},
            },
            {
              type: 'bears',
              id: '3',
              attributes: attrs.bears['3'],
              relationships: {},
            },
          ],
        },
      },
      powers: [
        {
          type: 'powers',
          id: 'careBearStare',
          attributes: attrs.powers.careBearStare,
          relationships: {},
        },
      ],
    },
  });
});

test('handles symmetric relationships', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    relationships: {
      best_friend: {},
    },
  });

  t.deepEqual(result, [
    {
      type: 'bears',
      id: '1',
      attributes: attrs.bears['1'],
      relationships: { best_friend: null },
    },
    {
      type: 'bears',
      id: '2',
      attributes: attrs.bears['2'],
      relationships: {
        best_friend: {
          type: 'bears',
          id: '3',
          attributes: attrs.bears['3'],
          relationships: {},
        },
      },
    },
    {
      type: 'bears',
      id: '3',
      attributes: attrs.bears['3'],
      relationships: {
        best_friend: {
          type: 'bears',
          id: '2',
          attributes: attrs.bears['2'],
          relationships: {},
        },
      },
    },
    {
      type: 'bears',
      id: '5',
      attributes: attrs.bears['5'],
      relationships: { best_friend: null },
    },
  ]);
});

test('creates new objects without relationships', async t => {
  await t.context.store.merge(grumpyBear);

  const result = await t.context.store.get({
    type: 'bears',
    id: '4',
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '4',
    attributes: grumpyBear.attributes,
    relationships: {},
  });
});

test('creates new objects with a relationship', async t => {
  await t.context.store.merge({
    ...grumpyBear,
    relationships: { home: '1' },
  });

  const result = await t.context.store.get({
    type: 'bears',
    id: '4',
    relationships: { home: {} },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '4',
    attributes: grumpyBear.attributes,
    relationships: {
      home: {
        type: 'homes',
        id: '1',
        attributes: attrs.homes['1'],
        relationships: {},
      },
    },
  });
});

test('merges into existing objects', async t => {
  await t.context.store.merge({
    type: 'bears',
    id: '2',
    attributes: { fur_color: 'just pink' },
  });

  const result = await t.context.store.get({
    type: 'bears',
    id: '2',
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '2',
    attributes: { ...attrs.bears['2'], fur_color: 'just pink' },
    relationships: {},
  });
});

test('merges into one-to-many relationship', async t => {
  await t.context.store.merge({
    type: 'bears',
    id: '1',
    relationships: { home: '2' },
  });

  const result = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: { home: {} },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {
      home: { type: 'homes', id: '2', relationships: {}, attributes: attrs.homes['2'] },
    },
  });
});

test('merges into many-to-one relationship', async t => {
  await t.context.store.merge({
    type: 'homes',
    id: '1',
    relationships: { bears: ['1'] },
  });

  const result = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.deepEqual(result, {
    type: 'homes',
    id: '1',
    attributes: attrs.homes['1'],
    relationships: {
      bears: [{ type: 'bears', id: '1', relationships: {}, attributes: attrs.bears['1'] }],
    },
  });
});

test('merges into many-to-many relationship', async t => {
  await t.context.store.merge({
    type: 'powers',
    id: 'makeWish',
    relationships: { bears: ['3'] },
  });

  const result = await t.context.store.get({
    type: 'powers',
    id: 'makeWish',
    relationships: { bears: {} },
  });

  t.deepEqual(result, {
    type: 'powers',
    id: 'makeWish',
    attributes: attrs.powers.makeWish,
    relationships: {
      bears: [{ type: 'bears', id: '3', relationships: {}, attributes: attrs.bears['3'] }],
    },
  });

  const result2 = await t.context.store.get({
    type: 'bears',
    id: '3',
    relationships: { powers: {} },
  });

  t.deepEqual(result2, {
    type: 'bears',
    id: '3',
    attributes: attrs.bears['3'],
    relationships: {
      powers: [
        {
          type: 'powers',
          id: 'careBearStare',
          relationships: {},
          attributes: attrs.powers.careBearStare,
        },
        { type: 'powers', id: 'makeWish', relationships: {}, attributes: attrs.powers.makeWish },
      ],
    },
  });
});

test('deletes objects', async t => {
  await t.context.store.delete({ type: 'bears', id: '1' });
  const result = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(result.relationships.bears.length, 2);
});

test('replaces a one-to-one relationship', async t => {
  await t.context.store.replaceRelationship({
    type: 'bears',
    id: '2',
    relationship: 'home',
    foreignId: '2',
  });

  const bearResult = await t.context.store.get({
    type: 'bears',
    id: '2',
    relationships: { home: {} },
  });

  t.is(bearResult.relationships.home.attributes.name, 'Forest of Feelings');

  const careALotResult = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(careALotResult.relationships.bears.length, 2);
});

test('replaces a one-to-many-relationship', async t => {
  await t.context.store.replaceRelationships({
    type: 'homes',
    id: '1',
    relationship: 'bears',
    foreignIds: ['1', '5'],
  });

  const bearResult = await t.context.store.get({
    type: 'bears',
    id: '2',
    relationships: { home: {} },
  });

  t.is(bearResult.relationships.home, null);

  const wonderheartResult = await t.context.store.get({
    type: 'bears',
    id: '5',
    relationships: { home: {} },
  });

  t.is(wonderheartResult.relationships.home.attributes.name, 'Care-a-Lot');

  const careALotResult = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(careALotResult.relationships.bears.length, 2);
});

test('appends to a to-many relationship', async t => {
  await t.context.store.appendRelationships({
    type: 'homes',
    id: '1',
    relationship: 'bears',
    foreignIds: ['1', '5'],
  });

  const bearResult = await t.context.store.get({
    type: 'bears',
    id: '5',
    relationships: { home: {} },
  });

  t.is(bearResult.relationships.home.attributes.name, 'Care-a-Lot');

  const careALotResult = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(careALotResult.relationships.bears.length, 4);
});

test('deletes a to-one relationship', async t => {
  await t.context.store.deleteRelationship({
    type: 'bears',
    id: '1',
    relationship: 'home',
  });

  const bearResult = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: { home: {} },
  });

  t.is(bearResult.relationships.home, null);

  const careALotResult = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(careALotResult.relationships.bears.length, 2);
});

test('deletes a to-many relationship', async t => {
  await t.context.store.deleteRelationships({
    type: 'homes',
    id: '1',
    relationship: 'bears',
    foreignIds: ['1'],
  });

  const bearResult = await t.context.store.get({
    type: 'bears',
    id: '1',
    relationships: { home: {} },
  });

  t.is(bearResult.relationships.home, null);

  const careALotResult = await t.context.store.get({
    type: 'homes',
    id: '1',
    relationships: { bears: {} },
  });

  t.is(careALotResult.relationships.bears.length, 2);
});
