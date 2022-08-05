import { pipeThru, uniq } from "@blossom/utils";
import { filterObj, mapObj, omit } from "@blossom/utils/objects";
import { difference } from "@blossom/utils/arrays";
import { ensureValidGetQuerySyntax, ensureValidSetQuerySyntax } from "../validation.mjs";
import { ERRORS, blossomError } from "../errors.mjs";

function normalizeShorthandLonghandKeys(query) {
  const shortLongPairs = [
    ["allProps", "allProperties"],
    ["excludedProps", "excludedProperties"],
    ["props", "properties"],
    ["rels", "relationships"],
  ];

  const outQuery = { ...query };
  shortLongPairs.forEach(([shorthand, longhand]) => {
    if (shorthand in query && longhand in query) {
      throw new blossomError(ERRORS.SHORTHAND_LONGHAND_BOTH_USED, {
        query,
        shorthand,
        longhand,
      });
    }

    if (shorthand in query || longhand in query) {
      outQuery[longhand] = query[shorthand] ?? query[longhand];
      delete outQuery[shorthand];
    }
  });

  return outQuery;
}

function normalizeProps(schema, query) {
  const schemaResDef = schema.resources[query.type];
  const nonRelProps = filterObj(
    schemaResDef.properties,
    ({ type }) => type !== "relationship",
  );
  const schemaNonRelKeys = Object.keys(nonRelProps);
  const schemaPropKeys = Object.keys(schemaResDef.properties);
  const excludedProperties = query.excludedProperties ?? [];

  const availableProps = uniq([
    ...(query.allProperties ? schemaNonRelKeys : []),
    ...(query.properties ?? []),
  ]);
  const properties = difference(availableProps, excludedProperties);

  const invalidProperties = difference(properties, schemaPropKeys);
  if (invalidProperties.length > 0) {
    throw new blossomError(ERRORS.INVALID_PROPS, {
      invalidProperties,
      queryProperties: properties,
      schemaProperties: schemaPropKeys,
    });
  }

  const invalidExcludedProperties = difference(excludedProperties, schemaPropKeys);
  if (invalidProperties.length > 0) {
    throw new blossomError(ERRORS.INVALID_EXCLUDED_PROPS, {
      invalidProperties: invalidExcludedProperties,
      queryProperties: properties,
      schemaProperties: schemaPropKeys,
    });
  }

  return { ...query, properties };
}

function normalizeAndExpandRels(schema, query) {
  if (!("relationships" in query)) {
    return { ...query, relationships: {} };
  }

  const schemaResDef = schema.resources[query.type];
  const relProps = filterObj(
    schemaResDef.properties,
    ({ type }) => type === "relationship",
  );

  const schemaRelationshipKeys = Object.keys(relProps);
  const queryRelationshipKeys = Object.keys(query.relationships);
  const invalidRelationships = difference(queryRelationshipKeys, schemaRelationshipKeys);

  if (invalidRelationships.length > 0) {
    throw new blossomError(ERRORS.INVALID_RELATIONSHIPS, {
      invalidRelationships,
      queryRelationshipKeys,
      schemaRelationshipKeys,
    });
  }

  const relationships = mapObj(query.relationships, (rel, relKey) => {
    const schemaRelDef = schemaResDef.properties[relKey];
    return normalizeQuery(schema, { ...rel, type: schemaRelDef.relatedType });
  });

  return { ...query, relationships };
}

function normalizeQuery(schema, rawQuery) {
  return pipeThru(rawQuery, [
    (q) => normalizeShorthandLonghandKeys(q),
    (q) => normalizeProps(schema, q),
    (q) => normalizeAndExpandRels(schema, q),
  ]);
}

export function denormalizeQuery(query) {
  const go = (subQuery, relKey) => ({
    ...omit(subQuery, relKey ? ["type", "id"] : []),
    ...(subQuery.properties.length > 0 ? { properties: subQuery.properties } : {}),
    ...(Object.keys(subQuery.relationships).length > 0
      ? { relationships: mapObj(subQuery.relationships, go) }
      : {}),
  });

  return go(query, null);
}

export function normalizeGetQuery(schema, rawQuery) {
  ensureValidGetQuerySyntax(schema, rawQuery);
  return normalizeQuery(schema, rawQuery);
}

export function normalizeSetQuery(schema, rawQuery) {
  ensureValidSetQuerySyntax(schema, rawQuery);
  return normalizeQuery(schema, rawQuery);
}
