import http from 'http';
import fortune from 'fortune';
import fortuneHTTP from 'fortune-http';
import jsonApiSerializer from 'fortune-json-api';

const store = fortune({
  bears: {
    name: String,
    gender: String,
    belly_badge: String,
    fur_color: String,

    home: ['homes', 'bears'],
    powers: [Array('powers'), 'bears'],
    best_friend: ['bears', 'best_friend'],
  },

  homes: {
    name: String,
    location: String,
    caring_meter: Number,

    bears: [Array('bears'), 'home'],
  },

  powers: {
    name: String,
    description: String,

    bears: [Array('bears'), 'powers'],
  },
});

async function reset() {
  await Promise.all(
    ['bears', 'homes', 'powers'].map(async type => {
      const records = await store.find(type);

      if (records.payload.count > 0) {
        return store.delete(
          type,
          records.payload.records.map(x => x.id)
        );
      }
    })
  );

  await store.create('bears', {
    id: '1',
    name: 'Tenderheart Bear',
    gender: 'male',
    belly_badge: 'heart',
    fur_color: 'tan',
  });

  await store.create('bears', {
    id: '2',
    name: 'Cheer Bear',
    gender: 'female',
    belly_badge: 'rainbow',
    fur_color: 'carnation pink',
  });

  await store.create('bears', {
    id: '3',
    name: 'Wish Bear',
    gender: 'female',
    belly_badge: 'shooting star',
    fur_color: 'turquoise',
    best_friend: '2',
  });

  await store.create('bears', {
    id: '5',
    name: 'Wonderheart Bear',
    gender: 'female',
    belly_badge: 'three hearts',
    fur_color: 'pink',
  });

  await store.create('homes', {
    id: '1',
    name: 'Care-a-Lot',
    location: 'Kingdom of Caring',
    caring_meter: 1,
    bears: ['1', '2', '3'],
  });
  await store.create('homes', {
    id: '2',
    name: 'Forest of Feelings',
    location: 'Kingdom of Caring',
    caring_meter: 1,
    bears: [],
  });

  await store.create('powers', {
    id: 'careBearStare',
    name: 'Care Bear Stare',
    description: 'Purges evil.',
    bears: ['1', '2', '3'],
  });

  await store.create('powers', {
    id: 'makeWish',
    name: 'Make a Wish',
    description: 'Makes a wish on Twinkers',
  });
}

reset();

const listener = fortuneHTTP(store, {
  serializers: [
    [jsonApiSerializer, { inflectType: false, inflectKeys: false, castNumericIds: false }],
  ],
});

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.url === '/reset') {
    return reset().then(() => res.end('reset'));
  }

  listener(req, res);
});
server.listen(8080);

console.log('go on port 8080');
