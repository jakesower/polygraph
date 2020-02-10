import test from 'ava';
import { parseResponse } from '../src/response-parser';
import { careBearsData, careBearsSchema } from '@polygraph/test-utils';

const attrs = careBearsData.objects;

test('handles a response for a single bear', async t => {
  const q = 'query { bear(id: "1") { name, belly_badge } }';
  const pgResponse = {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {},
  };
  const gqlResponse = await parseResponse(careBearsSchema, pgResponse, q);

  t.deepEqual(gqlResponse, {
    bear: {
      name: 'Tenderheart Bear',
      belly_badge: 'heart',
    },
  });
});

test('handles a response for a multiple bears', async t => {
  const q = 'query { bears { name, belly_badge } }';
  const pgResponse = [
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
  ];
  const gqlResponse = await parseResponse(careBearsSchema, pgResponse, q);

  t.deepEqual(gqlResponse, {
    bears: [
      { name: 'Tenderheart Bear', belly_badge: 'heart' },
      { name: 'Cheer Bear', belly_badge: 'rainbow' },
    ],
  });
});

test('handles a response for a single bear with relationships', async t => {
  const q = `query {
    bear(id: "1") {
      name
      belly_badge
      powers {
        name
      }
      home {
        name
      }
    }
  }`;
  const pgResponse = {
    type: 'bears',
    id: '1',
    attributes: attrs.bears['1'],
    relationships: {
      home: {
        type: 'homes',
        id: '1',
        attributes: attrs.homes['1'],
      },
      powers: [
        {
          type: 'powers',
          id: 'careBearStare',
          attributes: attrs.powers.careBearStare,
        },
      ],
    },
  };
  const gqlResponse = await parseResponse(careBearsSchema, pgResponse, q);

  t.deepEqual(gqlResponse, {
    bear: {
      name: 'Tenderheart Bear',
      belly_badge: 'heart',
      powers: [
        {
          name: 'Care Bear Stare',
        },
      ],
      home: {
        name: 'Care-a-Lot',
      },
    },
  });
});
