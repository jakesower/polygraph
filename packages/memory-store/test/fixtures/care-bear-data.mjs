export const careBearData = {
  bears: {
    1: {
      id: "1",
      name: "Tenderheart Bear",
      year_introduced: 1982,
      belly_badge: "red heart with pink outline",
      fur_color: "tan",
      best_friend: null,
      home: "1",
      powers: ["careBearStare"],
    },
    2: {
      id: "2",
      name: "Cheer Bear",
      year_introduced: 1982,
      belly_badge: "rainbow",
      fur_color: "carnation pink",
      home: "1",
      powers: ["careBearStare"],
      best_friend: "3",
    },
    3: {
      id: "3",
      name: "Wish Bear",
      year_introduced: 1982,
      belly_badge: "shooting star",
      fur_color: "turquoise",
      home: "1",
      powers: ["careBearStare"],
      best_friend: "2",
    },
    5: {
      id: "5",
      name: "Smart Heart Bear",
      year_introduced: 2005,
      belly_badge: "red apple with a small white heart-shaped shine",
      fur_color: "watermelon pink",
      best_friend: null,
      home: null,
      powers: ["careBearStare"],
    },
  },
  homes: {
    1: {
      id: "1",
      name: "Care-a-Lot",
      location: "Kingdom of Caring",
      caring_meter: 1,
      is_in_clouds: true,
      bears: ["1", "2", "3"],
    },
    2: {
      id: "2",
      name: "Forest of Feelings",
      location: "Kingdom of Caring",
      caring_meter: 1,
      is_in_clouds: false,
      bears: [],
    },
    3: {
      id: "3",
      name: "Earth",
      location: "Earth",
      caring_meter: 0.5,
      is_in_clouds: false,
      bears: [],
    },
  },
  powers: {
    careBearStare: {
      id: "careBearStare",
      name: "Care Bear Stare",
      description: "Purges evil.",
      type: "group power",
      bears: ["1", "2", "3", "5"],
    },
    makeWish: {
      id: "makeWish",
      name: "Make a Wish",
      description: "Makes a wish on Twinkers",
      type: "individual power",
      bears: [],
    },
  },
  companions: {},
};

export const grumpyBear = {
  id: "4",
  name: "Grumpy Bear",
  year_introduced: 1982,
  belly_badge: "raincloud",
  fur_color: "blue",
  best_friend: null,
  home: "1",
  powers: ["careBearStare"],
};

export const grumpyBearTree = {
  id: "4",
  name: "Grumpy Bear",
  year_introduced: 1982,
  belly_badge: "raincloud",
  fur_color: "blue",
  best_friend: null,
  home: { id: "1" },
  powers: [{ id: "careBearStare" }],
};
