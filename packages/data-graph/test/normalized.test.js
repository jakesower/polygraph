import test from 'ava';
import { DataGraph } from '../src';
import { NormalizedDataGraph } from '../src/normalized';

const yashin = {
  type: 'players',
  id: 'yashin',
  attributes: {
    firstName: 'Lev',
    lastName: 'Yashin',
    position: 'goalkeeper',
  },
};

const tsaryov = {
  type: 'players',
  id: 'tsaryov',
  attributes: {
    firstName: 'Viktor',
    lastName: 'Tsaryov',
    position: 'forward',
  },
};

const dynamoMoscow = {
  type: 'teams',
  id: 'dynamoMoscow',
  attributes: {
    name: 'Dynamo Moscow',
  },
};

const mvo = {
  type: 'teams',
  id: 'mvo',
  attributes: {
    name: 'MVO Kalinin',
  },
};

const ussr = {
  type: 'teams',
  id: 'ussr',
  attributes: {
    name: 'Soviet Union',
  },
};

const ref = resource => ({ type: resource.type, id: resource.id });

test('converts single resources to base form', t => {
  const query = { type: 'players', id: 'yashin' };
  const graph = NormalizedDataGraph(
    { root: ref(yashin), resources: { players: { yashin: { ...yashin, relationships: {} } } } },
    query
  );
  const base = graph.base();

  t.deepEqual(base, DataGraph({ ...yashin, relationships: {} }, query));
});

test('converts a single resources with a single relationship to base form', t => {
  const query = { type: 'players', id: 'yashin', relationships: { nationalTeam: {} } };
  const normalized = NormalizedDataGraph(
    {
      root: { type: 'players', id: 'yashin' },
      resources: {
        players: {
          yashin: {
            ...yashin,
            relationships: { nationalTeam: { type: 'teams', id: 'ussr' } },
          },
        },
        teams: { ussr: { ...ussr, relationships: {} } },
      },
    },

    query
  );

  const base = DataGraph(
    {
      ...yashin,
      relationships: {
        nationalTeam: {
          ...ussr,
          relationships: {},
        },
      },
    },
    query
  );

  const calcBase = normalized.base();

  t.deepEqual(calcBase, base);
});

test('converts multiple resources to normalized form', t => {
  const query = { type: 'players', relationships: {} };

  const normalized = NormalizedDataGraph(
    {
      root: [
        { type: 'players', id: 'yashin' },
        { type: 'players', id: 'tsaryov' },
      ],
      resources: {
        players: {
          yashin: {
            ...yashin,
            relationships: {},
          },
          tsaryov: {
            ...tsaryov,
            relationships: {},
          },
        },
      },
    },

    query
  );

  const base = DataGraph(
    [
      { ...yashin, relationships: {} },
      { ...tsaryov, relationships: {} },
    ],
    query
  );

  const result = normalized.base();

  t.deepEqual(result, base);
});

test('converts multiple resources with multiple relationships', t => {
  const dynamoMoscowNoRels = { ...dynamoMoscow, relationships: {} };
  const mvoNoRels = { ...mvo, relationships: {} };

  const query = { type: 'players', relationships: { leagueTeams: {} } };

  const normalized = NormalizedDataGraph(
    {
      root: [
        { type: 'players', id: 'yashin' },
        { type: 'players', id: 'tsaryov' },
      ],
      resources: {
        teams: { dynamoMoscow: dynamoMoscowNoRels, mvo: mvoNoRels },
        players: {
          yashin: {
            ...yashin,
            relationships: { leagueTeams: [{ id: 'dynamoMoscow', type: 'teams' }] },
          },
          tsaryov: {
            ...tsaryov,
            relationships: {
              leagueTeams: [
                { type: 'teams', id: 'mvo' },
                { type: 'teams', id: 'dynamoMoscow' },
              ],
            },
          },
        },
      },
    },

    query
  );

  const base = DataGraph(
    [
      { ...yashin, relationships: { leagueTeams: [dynamoMoscowNoRels] } },
      { ...tsaryov, relationships: { leagueTeams: [mvoNoRels, dynamoMoscowNoRels] } },
    ],
    query
  );

  const result = normalized.base();

  t.deepEqual(result, base);
});

test('a graph with relationships that loop back', t => {
  const dynamoMoscowWithPlayers = {
    ...dynamoMoscow,
    relationships: {
      players: [
        { ...yashin, relationships: {} },
        { ...tsaryov, relationships: {} },
      ],
    },
  };
  const mvoWithPlayers = {
    ...mvo,
    relationships: { players: [{ ...tsaryov, relationships: {} }] },
  };
  const query = {
    type: 'players',
    relationships: { leagueTeams: { relationships: { players: {} } } },
  };

  const normalized = NormalizedDataGraph(
    {
      root: [
        { type: 'players', id: 'yashin' },
        { type: 'players', id: 'tsaryov' },
      ],
      resources: {
        teams: {
          dynamoMoscow: {
            ...dynamoMoscow,
            relationships: {
              players: [
                { type: 'players', id: 'yashin' },
                { type: 'players', id: 'tsaryov' },
              ],
            },
          },
          mvo: { ...mvo, relationships: { players: [{ type: 'players', id: 'tsaryov' }] } },
        },
        players: {
          yashin: {
            ...yashin,
            relationships: { leagueTeams: [{ id: 'dynamoMoscow', type: 'teams' }] },
          },
          tsaryov: {
            ...tsaryov,
            relationships: {
              leagueTeams: [
                { type: 'teams', id: 'mvo' },
                { type: 'teams', id: 'dynamoMoscow' },
              ],
            },
          },
        },
      },
    },

    query
  );

  const base = DataGraph(
    [
      { ...yashin, relationships: { leagueTeams: [dynamoMoscowWithPlayers] } },
      { ...tsaryov, relationships: { leagueTeams: [mvoWithPlayers, dynamoMoscowWithPlayers] } },
    ],
    query
  );

  const result = normalized.base();

  t.deepEqual(result, base);
});
