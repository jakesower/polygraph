import test from "ava";
import { ERRORS } from "@blossom/core/errors";
import { omit } from "@blossom/utils";
import { schema } from "../fixtures/care-bear-schema.mjs";
import { MemoryStore } from "../../src/memory-store.mjs";
import { careBearData } from "../fixtures/care-bear-data.mjs";

// Test Setup
test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context = { store: MemoryStore(schema).seed(careBearData) };
});

// Actual Tests

test("fetches multiple resources", async (t) => {
  const result = await t.context.store.get({ type: "bears" });
  const expected = ["1", "2", "3", "5"].map((id) => ({ id }));

  t.deepEqual(result, expected);
});

test("fetches a single resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "1" });

  t.deepEqual(result, { id: "1" });
});

test("fetches null for a nonexistent resource", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "6" });

  t.deepEqual(result, null);
});

test("fetches a single resource specifying no sub queries desired", async (t) => {
  const result = await t.context.store.get({ type: "bears", id: "1", rels: {} });

  t.deepEqual(result, { id: "1" });
});

test("fetches a single resource with a many-to-one relationship", async (t) => {
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

test("a single resource with a one-to-many relationship", async (t) => {
  const q = {
    type: "homes",
    id: "1",
    rels: { bears: {} },
  };

  const result = await t.context.store.get(q);

  t.deepEqual(result, {
    id: "1",
    bears: [{ id: "1" }, { id: "2" }, { id: "3" }],
  });
});

test("fetches a single resource with a subset of props", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    props: ["name", "fur_color"],
  });

  t.deepEqual(result, { id: "1", name: "Tenderheart Bear", fur_color: "tan" });
});

test("fetches a single resource with a subset of props on a relationship", async (t) => {
  const q = {
    type: "bears",
    id: "1",
    rels: { home: { props: ["caring_meter"] } },
  };

  const result = await t.context.store.get(q);

  t.like(result, { id: "1", home: { id: "1", caring_meter: 1 } });
});

test("fetches a single resource with many-to-many relationship", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    rels: { powers: {} },
  });

  t.deepEqual(result, { id: "1", powers: [{ id: "careBearStare" }] });
});

test("fetches multiple sub queries of various types", async (t) => {
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

test("handles sub queries between the same type", async (t) => {
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

test("fetches all props", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allProps: true,
  });

  t.deepEqual(result, omit(careBearData.bears[1], ["home", "best_friend", "powers"]));
});

test("fetches all props except", async (t) => {
  const result = await t.context.store.get({
    type: "bears",
    id: "1",
    allProps: true,
    excludedProps: ["belly_badge"],
  });

  t.deepEqual(
    result,
    omit(careBearData.bears[1], ["belly_badge", "home", "best_friend", "powers"]),
  );
});

test("fails validation for invalid types", async (t) => {
  const err = await t.throwsAsync(async () => {
    await t.context.store.get({ type: "bearz", id: "1" });
  });

  t.deepEqual(err.message, ERRORS.INVALID_GET_QUERY_SYNTAX);
});

test("fails validation for invalid top level props", async (t) => {
  const err = await t.throwsAsync(async () => {
    await t.context.store.get({ type: "bears", id: "1", koopa: "troopa" });
  });

  t.deepEqual(err.message, ERRORS.INVALID_GET_QUERY_SYNTAX);
});

test("validates without an id", async (t) => {
  const result = await t.context.store.get({ type: "bears" });
  t.assert(Array.isArray(result));
});
