import anyTest, { TestInterface } from "ava";
import { schema as rawSchema } from "../care-bear-schema";
import { makeMemoryStore } from "../../src/memory-store";
import { compileSchema } from "../../src/data-structures/schema";
import { MemoryStore, NormalizedResources, Resource } from "../../src/types";

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
        best_friend: null,
        home: { type: "homes", id: "1" },
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
        home: { type: "homes", id: "1" },
        powers: [{ type: "powers", id: "careBearStare" }],
        best_friend: { type: "bears", id: "3" },
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
        home: { type: "homes", id: "1" },
        powers: [{ type: "powers", id: "careBearStare" }],
        best_friend: { type: "bears", id: "2" },
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
        best_friend: null,
        home: null,
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
} as NormalizedResources<typeof rawSchema>;

type S = typeof schema;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const empty: NormalizedResources<S> = {
  bears: {},
  homes: {},
  powers: {},
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyBear: Resource<S> = {
  type: "bears",
  id: "3",
  properties: {
    name: "Tenderheart",
    belly_badge: "heart",
    gender: "male",
    fur_color: "tan",
  },
  relationships: {
    best_friend: null,
    home: null,
    powers: [],
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const almostEmpty: NormalizedResources<S> = {
  ...empty,
  bears: {
    3: emptyBear,
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bearWithHome: Resource<S> = {
  ...emptyBear,
  relationships: {
    ...emptyBear.relationships,
    home: { type: "homes", id: "33223" },
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bearWithBadHome: Resource<S> = {
  ...emptyBear,
  relationships: {
    ...emptyBear.relationships,
    home: { type: "bears", id: "33223" }, // SHOULD NOT BE VALID!
  },
};

const test = anyTest as TestInterface<{ store: MemoryStore<typeof rawSchema> }>;

const resource = (type, id, getRels = true, overrides = {}) => ({
  id,
  type,
  ...normalizedData[type][id].properties,
  ...(getRels ? normalizedData[type][id].relationships : {}),
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

  t.deepEqual(result, resource("bears", "1", false, { home: resource("homes", "1") }));
});

test("fetches a single resource with many-to-many relationship", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    relationships: { powers: {} },
  });

  t.deepEqual(result, resource("bears", "1", false, { powers: [resource("powers", "careBearStare")] }));
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

  t.deepEqual(result, resource("bears", "1", false, {
    home: resource("homes", "1", false, { bears: ["1", "2", "3"].map((id) => resource("bears", id)) }),
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
    resource("bears", "1", false, { best_friend: null }),
    resource("bears", "2", false, { best_friend: resource("bears", "3") }),
    resource("bears", "3", false, { best_friend: resource("bears", "2") }),
    resource("bears", "5", false, { best_friend: null }),
  ]);
});
