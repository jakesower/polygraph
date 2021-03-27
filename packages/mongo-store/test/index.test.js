import test from 'ava';
import { expandSchema } from '@polygraph/schema-utils';
import { readFileSync } from 'fs';
import { MongoStore } from '../src';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { pick } from '@polygraph/utils';

const rawSchema = readFileSync(__dirname + '/care-bear-schema.json', { encoding: 'utf8' });
const schema = expandSchema(JSON.parse(rawSchema));

const mongod = new MongoMemoryServer();

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
      _id: '5fc2f8eabdbcca10e1fbc441',
      name: 'Tenderheart Bear',
      gender: 'male',
      belly_badge: 'heart',
      fur_color: 'tan',
      home: '5fc2f8eabdbcca10e1fbc451',
      powers: ['5fc2f8eabdbcca10e1fbc461'],
    },
    2: {
      _id: '5fc2f8eabdbcca10e1fbc442',
      name: 'Cheer Bear',
      gender: 'female',
      belly_badge: 'rainbow',
      fur_color: 'pink',
      home: '5fc2f8eabdbcca10e1fbc451',
      powers: ['5fc2f8eabdbcca10e1fbc461'],
    },
    3: {
      _id: '5fc2f8eabdbcca10e1fbc443',
      name: 'Wish Bear',
      gender: 'female',
      belly_badge: 'shooting star',
      fur_color: 'turquoise',
      home: '5fc2f8eabdbcca10e1fbc451',
      powers: ['5fc2f8eabdbcca10e1fbc461'],
    },
    5: {
      _id: '5fc2f8eabdbcca10e1fbc445',
      name: 'Wonderheart Bear',
      gender: 'female',
      belly_badge: 'three hearts',
      fur_color: 'pink',
      home: '5fc2f8eabdbcca10e1fbc451',
      powers: ['5fc2f8eabdbcca10e1fbc461'],
    },
  },
  homes: {
    1: {
      _id: '5fc2f8eabdbcca10e1fbc451',
      name: 'Care-a-Lot',
      location: 'Kingdom of Caring',
      caring_meter: 1,
    },
    2: {
      _id: '5fc2f8eabdbcca10e1fbc452',
      name: 'Forest of Feelings',
      location: 'Kingdom of Caring',
      caring_meter: 1,
    },
  },
  powers: {
    1: {
      _id: '5fc2f8eabdbcca10e1fbc461',
      name: 'Care Bear Stare',
      description: 'Purges evil.',
    },
    2: {
      _id: '5fc2f8eabdbcca10e1fbc462',
      name: 'Make a Wish',
      description: 'Makes a wish on Twinkers',
    },
  },
};

const _idOf = (type, id) => attrs[type][id]._id;

const bearAttrs = id => pick(attrs.bears[id], ['name', 'gender', 'belly_badge', 'fur_color']);
const bearRecord = id => ({
  type: 'bears',
  id: _idOf('bears', id),
  attributes: bearAttrs(id),
  relationships: {},
});

const homeAttrs = id => pick(attrs.homes[id], ['name', 'location', 'caring_meter']);
const homeRecord = id => ({
  type: 'homes',
  id: _idOf('homes', id),
  attributes: homeAttrs(id),
  relationships: {},
});

const powerAttrs = id => pick(attrs.powers[id], ['name', 'description']);
const powerRecord = id => ({
  type: 'powers',
  id: _idOf('powers', id),
  attributes: powerAttrs(id),
  relationships: {},
});

test.before(async t => {
  const uri = await mongod.getUri();

  await mongoose.connect(uri);

  await mongoose.model(
    'bears',
    new mongoose.Schema({
      name: String,
      gender: String,
      belly_badge: String,
      fur_color: String,
      home: { type: String, ref: 'homes' },
      powers: [{ type: String, ref: 'powers' }],
    })
  );

  await mongoose.model(
    'homes',
    new mongoose.Schema({
      name: String,
      location: String,
      caring_meter: Number,
      bears: { type: String, ref: 'bears' },
    })
  );

  await mongoose.model(
    'powers',
    new mongoose.Schema({
      name: String,
      description: String,
    })
  );
});

test.beforeEach(async t => {
  await Promise.all(
    ['homes', 'bears', 'powers'].map(type =>
      mongoose.connection.collections[type].insertMany(
        Object.values(attrs[type]).map(recordAttrs => ({
          ...recordAttrs,
          _id: mongoose.Types.ObjectId(recordAttrs._id),
        }))
      )
    )
  );

  t.context = { store: MongoStore(schema, mongoose) };
});

test.afterEach(async t => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
  // await mongoose.deleteModel(/.+/);
});

test('fetches a single resource', async t => {
  const result = await t.context.store.get({ type: 'bears', id: _idOf('bears', 1) });

  t.deepEqual(result, {
    type: 'bears',
    id: _idOf('bears', 1),
    attributes: bearAttrs(1),
    relationships: {},
  });
});

test('does not fetch a nonexistent resource', async t => {
  const result = await t.context.store.get({ type: 'bears', id: '5fc2f8eabdbcca10e1fbc446' });

  t.deepEqual(result, null);
});

test('fetches multiple resources', async t => {
  const result = await t.context.store.get({ type: 'bears' });

  t.deepEqual(result, [
    {
      type: 'bears',
      id: _idOf('bears', 1),
      attributes: bearAttrs(1),
      relationships: {},
    },
    {
      type: 'bears',
      id: _idOf('bears', 2),
      attributes: bearAttrs(2),
      relationships: {},
    },
    {
      type: 'bears',
      id: _idOf('bears', 3),
      attributes: bearAttrs(3),
      relationships: {},
    },
    {
      type: 'bears',
      id: _idOf('bears', 5),
      attributes: bearAttrs(5),
      relationships: {},
    },
  ]);
});

test('fetches resources with an equality condition', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    relationships: {},
    filter: { gender: { $eq: 'male' } },
  });

  t.deepEqual(result, [
    {
      type: 'bears',
      id: _idOf('bears', 1),
      attributes: bearAttrs(1),
      relationships: {},
    },
  ]);
});

test('fetches resources with a compound condition', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    relationships: {},
    filter: { gender: { $eq: 'female' }, fur_color: { $eq: 'pink' } },
  });

  t.deepEqual(result, [
    {
      type: 'bears',
      id: _idOf('bears', 2),
      attributes: bearAttrs(2),
      relationships: {},
    },
    {
      type: 'bears',
      id: _idOf('bears', 5),
      attributes: bearAttrs(5),
      relationships: {},
    },
  ]);
});

test('fetches resources with a nested condition', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    relationships: {},
    filter: { fur_color: { $or: [{ $eq: 'pink' }, { $eq: 'turquoise' }] } },
  });

  t.deepEqual(result, [bearRecord(2), bearRecord(3), bearRecord(5)]);
});

test('fetches a single resource with a single relationship', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: _idOf('bears', 1),
    relationships: { home: {} },
  });

  t.deepEqual(result, {
    ...bearRecord(1),
    relationships: {
      home: homeRecord(1),
    },
  });
});

test('fetches a single resource with many-to-many relationship', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: _idOf('bears', 1),
    relationships: { powers: {} },
  });

  t.deepEqual(result, {
    type: 'bears',
    id: _idOf('bears', 1),
    attributes: bearAttrs(1),
    relationships: {
      powers: [powerRecord(1)],
    },
  });
});

test.only('fetches multiple relationships of various types', async t => {
  const result = await t.context.store.get({
    type: 'bears',
    id: _idOf('bears', 1),
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
    ...bearRecord(1),
    relationships: {
      home: {
        ...homeRecord(1),
        relationships: {
          bears: [bearRecord(1), bearRecord(2), bearRecord(3), bearRecord(5)],
        },
      },
      powers: [powerRecord(1)],
    },
  });
});

// test('handles symmetric relationships', async t => {
//   const result = await t.context.store.get({
//     type: 'bears',
//     relationships: {
//       best_friend: {},
//     },
//   });

//   t.deepEqual(result, [
//     {
//       type: 'bears',
//       id: '1',
//       attributes: bearAttrs(1),
//       relationships: { best_friend: null },
//     },
//     {
//       type: 'bears',
//       id: '2',
//       attributes: bearAttrs(2),
//       relationships: {
//         best_friend: {
//           type: 'bears',
//           id: '3',
//           attributes: bearAttrs(3),
//           relationships: {},
//         },
//       },
//     },
//     {
//       type: 'bears',
//       id: '3',
//       attributes: bearAttrs(3),
//       relationships: {
//         best_friend: {
//           type: 'bears',
//           id: '2',
//           attributes: bearAttrs(2),
//           relationships: {},
//         },
//       },
//     },
//     {
//       type: 'bears',
//       id: '5',
//       attributes: bearAttrs(5),
//       relationships: { best_friend: null },
//     },
//   ]);
// });

// test('creates new objects without relationships', async t => {
//   await t.context.store.merge(grumpyBear);

//   const result = await t.context.store.get({
//     type: 'bears',
//     id: '4',
//   });

//   t.deepEqual(result, {
//     type: 'bears',
//     id: '4',
//     attributes: grumpyBear.attributes,
//     relationships: {},
//   });
// });

// test('creates new objects with a relationship', async t => {
//   await t.context.store.merge({
//     ...grumpyBear,
//     relationships: { home: '1' },
//   });

//   const result = await t.context.store.get({
//     type: 'bears',
//     id: '4',
//     relationships: { home: {} },
//   });

//   t.deepEqual(result, {
//     type: 'bears',
//     id: '4',
//     attributes: grumpyBear.attributes,
//     relationships: {
//       home: {
//         type: 'homes',
//         id: '1',
//         attributes: attrs.homes['1'],
//         relationships: {},
//       },
//     },
//   });
// });

// test('merges into existing objects', async t => {
//   await t.context.store.merge({
//     type: 'bears',
//     id: '2',
//     attributes: { fur_color: 'just pink' },
//   });

//   const result = await t.context.store.get({
//     type: 'bears',
//     id: '2',
//   });

//   t.deepEqual(result, {
//     type: 'bears',
//     id: '2',
//     attributes: { ...bearAttrs(2), fur_color: 'just pink' },
//     relationships: {},
//   });
// });

// test('merges into one-to-many relationship', async t => {
//   await t.context.store.merge({
//     type: 'bears',
//     id: '1',
//     relationships: { home: '2' },
//   });

//   const result = await t.context.store.get({
//     type: 'bears',
//     id: '1',
//     relationships: { home: {} },
//   });

//   t.deepEqual(result, {
//     type: 'bears',
//     id: '1',
//     attributes: bearAttrs(1),
//     relationships: {
//       home: { type: 'homes', id: '2', relationships: {}, attributes: attrs.homes['2'] },
//     },
//   });
// });

// test('merges into many-to-one relationship', async t => {
//   await t.context.store.merge({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: ['1'] },
//   });

//   const result = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.deepEqual(result, {
//     type: 'homes',
//     id: '1',
//     attributes: attrs.homes['1'],
//     relationships: {
//       bears: [{ type: 'bears', id: '1', relationships: {}, attributes: bearAttrs(1) }],
//     },
//   });
// });

// test('merges into many-to-many relationship', async t => {
//   await t.context.store.merge({
//     type: 'powers',
//     id: 'makeWish',
//     relationships: { bears: ['3'] },
//   });

//   const result = await t.context.store.get({
//     type: 'powers',
//     id: 'makeWish',
//     relationships: { bears: {} },
//   });

//   t.deepEqual(result, {
//     type: 'powers',
//     id: 'makeWish',
//     attributes: attrs.powers.makeWish,
//     relationships: {
//       bears: [{ type: 'bears', id: '3', relationships: {}, attributes: bearAttrs(3) }],
//     },
//   });

//   const result2 = await t.context.store.get({
//     type: 'bears',
//     id: '3',
//     relationships: { powers: {} },
//   });

//   t.deepEqual(result2, {
//     type: 'bears',
//     id: '3',
//     attributes: bearAttrs(3),
//     relationships: {
//       powers: [
//         {
//           type: 'powers',
//           id: 'careBearStare',
//           relationships: {},
//           attributes: attrs.powers.careBearStare,
//         },
//         { type: 'powers', id: 'makeWish', relationships: {}, attributes: attrs.powers.makeWish },
//       ],
//     },
//   });
// });

// test('deletes objects', async t => {
//   await t.context.store.delete({ type: 'bears', id: '1' });
//   const result = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(result.relationships.bears.length, 2);
// });

// test('replaces a one-to-one relationship', async t => {
//   await t.context.store.replaceRelationship({
//     type: 'bears',
//     id: '2',
//     relationship: 'home',
//     foreignId: '2',
//   });

//   const bearResult = await t.context.store.get({
//     type: 'bears',
//     id: '2',
//     relationships: { home: {} },
//   });

//   t.is(bearResult.relationships.home.attributes.name, 'Forest of Feelings');

//   const careALotResult = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(careALotResult.relationships.bears.length, 2);
// });

// test('replaces a one-to-many-relationship', async t => {
//   await t.context.store.replaceRelationships({
//     type: 'homes',
//     id: '1',
//     relationship: 'bears',
//     foreignIds: ['1', '5'],
//   });

//   const bearResult = await t.context.store.get({
//     type: 'bears',
//     id: '2',
//     relationships: { home: {} },
//   });

//   t.is(bearResult.relationships.home, null);

//   const wonderheartResult = await t.context.store.get({
//     type: 'bears',
//     id: '5',
//     relationships: { home: {} },
//   });

//   t.is(wonderheartResult.relationships.home.attributes.name, 'Care-a-Lot');

//   const careALotResult = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(careALotResult.relationships.bears.length, 2);
// });

// test('appends to a to-many relationship', async t => {
//   await t.context.store.appendRelationships({
//     type: 'homes',
//     id: '1',
//     relationship: 'bears',
//     foreignIds: ['1', '5'],
//   });

//   const bearResult = await t.context.store.get({
//     type: 'bears',
//     id: '5',
//     relationships: { home: {} },
//   });

//   t.is(bearResult.relationships.home.attributes.name, 'Care-a-Lot');

//   const careALotResult = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(careALotResult.relationships.bears.length, 4);
// });

// test('deletes a to-one relationship', async t => {
//   await t.context.store.deleteRelationship({
//     type: 'bears',
//     id: '1',
//     relationship: 'home',
//   });

//   const bearResult = await t.context.store.get({
//     type: 'bears',
//     id: '1',
//     relationships: { home: {} },
//   });

//   t.is(bearResult.relationships.home, null);

//   const careALotResult = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(careALotResult.relationships.bears.length, 2);
// });

// test('deletes a to-many relationship', async t => {
//   await t.context.store.deleteRelationships({
//     type: 'homes',
//     id: '1',
//     relationship: 'bears',
//     foreignIds: ['1'],
//   });

//   const bearResult = await t.context.store.get({
//     type: 'bears',
//     id: '1',
//     relationships: { home: {} },
//   });

//   t.is(bearResult.relationships.home, null);

//   const careALotResult = await t.context.store.get({
//     type: 'homes',
//     id: '1',
//     relationships: { bears: {} },
//   });

//   t.is(careALotResult.relationships.bears.length, 2);
// });
