const fortune = require('fortune');

const store = new fortune({
  bears: {
    name: String,
    home: ['homes', 'bears'],
  },

  homes: {
    name: String,
    bears: [Array('bears'), 'home'],
  },
});

(async function() {
  await Promise.all([
    store.create('bears', { id: 'a', name: 'Tenderheart' }),
    store.create('bears', { id: 'b', name: 'Sleepy Bear' }),
  ]);
  await store.create('homes', { name: 'Care-a-Lot', bears: ['a', 'b'] });

  const x = await store.find('bears', ['a'], null, [['home'], ['home', 'bears']]);

  console.log(x.payload);
  console.log(x.payload.include.homes);
})();
