import test from "ava";
import { ERRORS } from "@blossom/core/errors";
import { omit } from "@blossom/utils";
import { schema } from "../../fixtures/care-bear-schema.mjs";
import { careBearData } from "../../fixtures/care-bear-data.mjs";
import { BaseStore } from "../../../src/base-store.mjs";

// Test Setup
test.beforeEach(async (t) => {
  const genericGetAll = (resourceType) => Object.values(careBearData[resourceType]);
  const resolvers = {
    generic: { all: genericGetAll },
  };

  // eslint-disable-next-line no-param-reassign
  t.context = {
    store: await BaseStore(schema, { resolvers }),
  };
});

// Actual Tests

test.skip("fetches a single resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "1" });

  t.deepEqual(result, { id: "1" });
});

test.skip("fetches null for a nonexistent resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "6" });

  t.deepEqual(result, null);
});

test.only("fetches multiple resources", async (t) => {
  const result = await t.context.store.get({ type: "bears" });
  const expected = ["1", "2", "3", "5"].map((id) => ({ id }));

  t.deepEqual(result, expected);
});

test.skip("fetches a single resource specifying no sub queries desired", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "1", rels: {} });

  t.deepEqual(result, { id: "1" });
});

test.skip("fetches a single resource with a single relationship", async (t) => {
  const q = {
    type: "bears",
    id: "1",
    rels: { home: {} },
  };

  const result = await t.context.store.get(q);

  t.deepEqual(result, {
    id: "1",
    home: { id: "1" },
  });
});

test.skip("fetches a single resource with a subset of props", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    props: ["name", "fur_color"],
  });

  t.deepEqual(result, { id: "1", name: "Tenderheart Bear", fur_color: "tan" });
});

test.skip("fetches a single resource with a relationship ref prop", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    props: ["home"],
  });

  t.deepEqual(result, { id: "1", home: { type: "homes", id: "1" } });
});

test.skip("fetches a single resource with a subset of props on a relationship", async (t) => {
  const q = {
    type: "bears",
    id: "1",
    rels: { home: { props: ["caring_meter"] } },
  };

  const result = await t.context.store.get(q);

  t.like(result, { id: "1", home: { id: "1", caring_meter: 1 } });
});

test.skip("fetches a single resource with many-to-many relationship", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    rels: { powers: {} },
  });

  t.deepEqual(result, { id: "1", powers: [{ id: "careBearStare" }] });
});

test.skip("fetches multiple sub queries of various types", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    rels: {
      home: {
        rels: {
          bears: {},
        },
      },
      powers: {},
    },
  });

  t.deepEqual(result, {
    id: "1",
    home: { id: "1", bears: [{ id: "1" }, { id: "2" }, { id: "3" }] },
    powers: [{ id: "careBearStare" }],
  });
});

test.skip("handles sub queries between the same type", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    rels: {
      best_friend: {},
    },
  });

  t.deepEqual(result, [
    { id: "1", best_friend: null },
    { id: "2", best_friend: { id: "3" } },
    { id: "3", best_friend: { id: "2" } },
    { id: "5", best_friend: null },
  ]);
});

test.skip("fetches relationships as refs when used as props", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    props: ["home"],
  });

  t.deepEqual(result, { id: "1", home: { id: "1", type: "homes" } });
});

test.skip("fetches all props", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allNonRefProps: true,
  });

  t.deepEqual(result, omit(careBearData.bears[1], ["home", "best_friend", "powers"]));
});

test.skip("fetches all props except", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allNonRefProps: true,
    excludedProps: ["belly_badge"],
  });

  t.deepEqual(
    result,
    omit(careBearData.bears[1], ["belly_badge", "home", "best_friend", "powers"]),
  );
});

test.skip("fetches all props and refs", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allNonRefProps: true,
    allRefProps: true,
  });

  t.deepEqual(result, careBearData.bears[1]);
});

test.skip("fetches all props and refs except", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allNonRefProps: true,
    allRefProps: true,
    excludedProperties: ["belly_badge"],
  });

  t.deepEqual(result, omit(careBearData.bears[1], ["belly_badge"]));
});

test.skip("fails validation for invalid types", async (t) => {
  const err = await t.throwsAsync(async () => {
    await t.context.store.get({ type: "bearz", id: "1" });
  });

  t.deepEqual(err.message, ERRORS.INVALID_GET_QUERY_SYNTAX);
});

test.skip("fails validation for invalid top level props", async (t) => {
  const err = await t.throwsAsync(async () => {
    await t.context.store.get({ type: "bears", id: "1", koopa: "troopa" });
  });

  t.deepEqual(err.message, ERRORS.INVALID_GET_QUERY_SYNTAX);
});

test.skip("validates without an id", async (t) => {
  const result = await t.context.store.get({ type: "bears" });
  t.assert(Array.isArray(result));
});
