import test from 'ava';
import { parse } from '../src/parse';

test('parses a typical query with attributes', async t => {
  const result = parse(`
    crops {
      name
      planting_season
    }
  `);

  t.deepEqual(result, {
    type: 'crops',
    options: {},
    attributes: ['name', 'planting_season'],
    relationships: {},
  });
});

test('parses a typical query with attributes and relationships', async t => {
  const result = parse(`
    crops {
      name
      planting_season
      farm {
        state
      }
    }
  `);

  t.deepEqual(result, {
    type: 'crops',
    options: {},
    attributes: ['name', 'planting_season'],
    relationships: {
      farm: {
        type: 'farm',
        options: {},
        attributes: ['state'],
        relationships: {},
      },
    },
  });
});

test('parses a query with some options', async t => {
  const result = parse(`
      crops(type: cash, grower2: "Old MacDonald", $id: "44", "oblig atory": "\\" back \\\\ slash,",) {
        name
        planting_season
      }
    `);

  t.deepEqual(result, {
    type: 'crops',
    options: {
      type: 'cash',
      grower2: 'Old MacDonald',
      $id: '44',
      'oblig atory': '" back \\ slash,',
    },
    attributes: ['name', 'planting_season'],
    relationships: {},
  });
});

// test('parses a query with some object and array options', async t => {
//   const result = parse(`
//       crops(
//         type: cash,
//         $sort: [
//           { fertility: -1 },
//           { height: -1 }
//         ]
//       ) {
//         name
//         planting_season
//       }
//     `);

//   t.deepEqual(result, {
//     type: 'crops',
//     options: {
//       type: 'cash',
//       grower2: 'Old MacDonald',
//       $id: '44',
//       'oblig otory': '" back \\ slash,',
//     },
//     attributes: ['name', 'planting_season'],
//     relationships: {},
//   });
// });

test("doesn't parse with a missing curly at the end", t => {
  const error = t.throws(() => {
    parse('crops { name ');
  });

  t.is(error.message, "Expected '}' before the end of the query string");
});

test("doesn't parse with an unterminated options string", t => {
  const error = t.throws(() => {
    parse('crops ("Bad thing: other) { oops }');
  });

  t.is(error.message, 'Unterminated quoted string starting at index 7');
});

test("doesn't parse with a single quoted option key", t => {
  const error = t.throws(() => {
    parse('crops ("Bad thing": "other) { oops }');
  });

  t.is(error.message, 'Unterminated quoted string starting at index 20');
});

test("doesn't parse with a single quoted option value", t => {
  const error = t.throws(() => {
    parse("crops(option: 'so called') { name } ");
  });

  t.is(
    error.message,
    "Option keys and values may only contain letters, numbers, '_', '$', or be double quoted at index 14"
  );
});

test("doesn't parse with no attributes or relationship", t => {
  const error = t.throws(() => {
    parse('crops { } ');
  });

  t.is(error.message, 'Expected at least one attribute or relationship within block at index 8');
});

test("doesn't parse with no resource block", t => {
  const error = t.throws(() => {
    parse('crops');
  });

  t.is(error.message, 'Expected resource block in query string');
});
