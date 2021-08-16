import anyTest, { TestInterface } from "ava";
import { schema as rawSchema } from "../care-bear-schema";
import { makeMemoryStore } from "../../src/memory-store";
import { compileSchema } from "../../src/data-structures/schema";
import { MemoryStore } from "../../src/types";

const test = anyTest as TestInterface<{ store: MemoryStore }>;

const schema = compileSchema(rawSchema);
const normalizedData = {
  bears: {
    1: {
      type: "bears",
      id: "1",
      properties: {
        name: "Tenderheart Bear",
        gender: "male",
        belly_badge: "heart",
        fur_color: "tan",
      },
      relationships: {
        home: [{ type: "homes", id: "1" }],
        powers: [{ type: "powers", id: "careBearStare" }],
      },
    },
    2: {
      type: "bears",
      id: "2",
      properties: {
        name: "Cheer Bear",
        gender: "female",
        belly_badge: "rainbow",
        fur_color: "carnation pink",
      },
      relationships: {
        home: [{ type: "homes", id: "1" }],
        powers: [{ type: "powers", id: "careBearStare" }],
        best_friend: [{ type: "bears", id: "3" }],
      },
    },
    3: {
      type: "bears",
      id: "3",
      properties: {
        name: "Wish Bear",
        gender: "female",
        belly_badge: "shooting star",
        fur_color: "turquoise",
      },
      relationships: {
        home: [{ type: "homes", id: "1" }],
        powers: [{ type: "powers", id: "careBearStare" }],
        best_friend: [{ type: "bears", id: "2" }],
      },
    },
    5: {
      type: "bears",
      id: "5",
      properties: {
        name: "Wonderheart Bear",
        gender: "female",
        belly_badge: "three hearts",
        fur_color: "pink",
      },
      relationships: {
        home: [],
        powers: [{ type: "powers", id: "careBearStare" }],
      },
    },
  },
  homes: {
    1: {
      type: "homes",
      id: "1",
      properties: {
        name: "Care-a-Lot",
        location: "Kingdom of Caring",
        caring_meter: 1,
      },
      relationships: {
        bears: [{ type: "bears", id: "1" }, { type: "bears", id: "2" }, { type: "bears", id: "3" }],
      },
    },
    2: {
      type: "homes",
      id: "2",
      properties: {
        name: "Forest of Feelings",
        location: "Kingdom of Caring",
        caring_meter: 1,
      },
      relationships: {
        bears: [],
      },
    },
  },
  powers: {
    careBearStare: {
      type: "powers",
      id: "careBearStare",
      properties: {
        name: "Care Bear Stare",
        description: "Purges evil.",
      },
      relationships: { bears: [{ type: "bears", id: "1" }, { type: "bears", id: "2" }, { type: "bears", id: "3" }, { type: "bears", id: "5" }] },
    },
    makeWish: {
      type: "powers",
      id: "makeWish",
      properties: {
        name: "Make a Wish",
        description: "Makes a wish on Twinkers",
      },
      relationships: {
        bears: [],
      },
    },
  },
};

const resource = (type, id, overrides = {}) => ({
  id,
  type,
  ...normalizedData[type][id].properties,
  ...overrides,
});

test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context = { store: await makeMemoryStore(schema, { initialData: normalizedData }) };
});

test("fetches a single resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "1" });

  t.deepEqual(result, resource("bears", "1"));
});

test("does not fetch a nonexistent resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "6" });

  t.deepEqual(result, null);
});

test("fetches multiple resources", async (t) => {
  const result = await t.context.store.get({ type: "bears" });

  t.deepEqual(result, ["1", "2", "3", "5"].map((id) => resource("bears", id)));
});

test("fetches a single resource with a single relationship", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    relationships: { home: {} },
  });

  t.deepEqual(result, resource("bears", "1", { home: resource("homes", "1") }));
});

test("fetches a single resource with many-to-many relationship", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    relationships: { powers: {} },
  });

  t.deepEqual(result, resource("bears", "1", { powers: [resource("powers", "careBearStare")] }));
});

test("fetches multiple relationships of various types", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    relationships: {
      home: {
        relationships: {
          bears: {},
        },
      },
      powers: {},
    },
  });

  t.deepEqual(result, resource("bears", "1", {
    home: resource("homes", "1", { bears: ["1", "2", "3"].map((id) => resource("bears", id)) }),
    powers: [resource("powers", "careBearStare")],
  }));
});

test("handles relationships between the same type", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    relationships: {
      best_friend: {},
    },
  });

  t.deepEqual(result, [
    resource("bears", "1", { best_friend: null }),
    resource("bears", "2", { best_friend: resource("bears", "3") }),
    resource("bears", "3", { best_friend: resource("bears", "2") }),
    resource("bears", "5", { best_friend: null }),
  ]);
});