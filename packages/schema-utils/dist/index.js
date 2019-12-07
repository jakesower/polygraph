"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const utils_1 = require("@polygraph/utils");
const schema_schema_json_1 = __importDefault(require("./etc/schema.schema.json"));
function schemaErrors(rawSchema) {
    const validate = new ajv_1.default().compile(schema_schema_json_1.default);
    if (validate(rawSchema)) {
        return utils_1.reduceObj(rawSchema.resources, [], (errs, resource, resourceName) => [
            ...errs,
            ...utils_1.reduceObj(resource.relationships, [], (rErrs, rel, relName) => [
                ...rErrs,
                ...(rel.inverse in rawSchema.resources[rel.type].relationships
                    ? []
                    : [
                        `the "${relName}" relationship on the "${resourceName}" resource does not have a valid inverse`,
                    ]),
            ]),
        ]);
    }
    return JSON.stringify(validate.errors);
}
// inlines keys and otherwise makes a schema easier to work with
function expandSchema(rawSchema) {
    const errors = schemaErrors(rawSchema);
    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors, null, 2));
    }
    return utils_1.overPath(rawSchema, ['resources'], resources => utils_1.inlineKey(utils_1.mapObj(resources, r => (Object.assign(Object.assign({}, r), { attributes: utils_1.inlineKey(r.attributes), relationships: utils_1.inlineKey(r.relationships) })))));
}
exports.expandSchema = expandSchema;
function resourceNames(schema) {
    return Object.keys(schema.resources);
}
exports.resourceNames = resourceNames;
function resourceAttributes(schema, resourceType) {
    return schema.resources[resourceType].attributes;
}
exports.resourceAttributes = resourceAttributes;
function attributeNames(schema, resourceType) {
    return Object.keys(schema.resources[resourceType].attributes);
}
exports.attributeNames = attributeNames;
function relationshipNames(schema, resourceType) {
    return Object.keys(schema.resources[resourceType].relationships);
}
exports.relationshipNames = relationshipNames;
function extractAttributes(schema, resourceType, obj) {
    return utils_1.pluckKeys(obj, attributeNames(schema, resourceType));
}
exports.extractAttributes = extractAttributes;
function inverseRelationship(schema, resourceType, relationshipName) {
    const def = schema.resources[resourceType].relationships[relationshipName];
    if (!def) {
        throw { resourceType, relationshipName, schema };
    }
    return schema.resources[def.type].relationships[def.inverse];
}
exports.inverseRelationship = inverseRelationship;
function canonicalRelationship(schema, resourceType, relationshipName) {
    const key = def => `${def.type}/${def.inverse}`;
    const relationshipDef = schema.resources[resourceType].relationships[relationshipName];
    const inverseDef = inverseRelationship(schema, resourceType, relationshipDef.key);
    return key(inverseDef) < key(relationshipDef)
        ? { name: key(inverseDef), locality: 'local' }
        : { name: key(relationshipDef), locality: 'foreign' };
}
exports.canonicalRelationship = canonicalRelationship;
function canonicalRelationshipName(schema, resourceType, relationshipName) {
    return canonicalRelationship(schema, resourceType, relationshipName).name;
}
exports.canonicalRelationshipName = canonicalRelationshipName;
function canonicalRelationshipNames(schema) {
    return utils_1.uniq(Object.values(schema.resources).reduce((names, resource) => Object.values(resource.relationships).reduce((relNames, rel) => [
        ...relNames,
        canonicalRelationshipName(schema, resource.key, rel.key),
    ], names), []));
}
exports.canonicalRelationshipNames = canonicalRelationshipNames;
function isSymmetricRelationship(schema, resourceType, relationshipName) {
    const relationshipDef = schema.resources[resourceType].relationships[relationshipName];
    return resourceType === relationshipDef.type && relationshipDef.key === relationshipName;
}
exports.isSymmetricRelationship = isSymmetricRelationship;
function joinTableName(relationship) {
    return relationship.inverse > relationship.key
        ? `${relationship.key}_${relationship.inverse}`
        : `${relationship.inverse}_${relationship.key}`;
}
exports.joinTableName = joinTableName;
