"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@polygraph/utils");
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
/**
 * This is the much more succinct sibling of the query builder. It's a
 * relatively straightforward operation to unwind the graph-like polygraph
 * response into a graphql response.
 */
function parseResponse(pgSchema, pgResponse, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const typeDefs = buildTypeDefs(pgSchema);
        const id = x => x;
        const resolvers = Object.keys(pgSchema.resources).reduce((out, resName) => {
            const { singular, attributes, relationships } = pgSchema.resources[resName];
            const nextQuery = Object.assign(Object.assign({}, out.Query), { [resName]: id, [singular]: id });
            const attrs = utils_1.mapObj(attributes, attr => obj => obj.attributes[attr.key]);
            const rels = utils_1.mapObj(relationships, rel => obj => obj.relationships[rel.key]);
            return Object.assign(Object.assign({}, out), { Query: nextQuery, [singular]: Object.assign(Object.assign({}, attrs), rels) });
        }, { Query: {} });
        const gqlSchema = graphql_tools_1.makeExecutableSchema({ typeDefs, resolvers });
        const result = yield graphql_1.graphql(gqlSchema, query, pgResponse);
        if (result.errors) {
            throw result.errors;
        }
        return JSON.parse(JSON.stringify(result.data));
    });
}
exports.parseResponse = parseResponse;
function buildTypeDefs(pgSchema) {
    const relType = (relDef, relName) => {
        const [ob, cb] = relDef.cardinality === 'one' ? ['', ''] : ['[', ']'];
        const type = pgSchema.resources[relDef.type].singular;
        return `${relName}: ${ob}${type}${cb}`;
    };
    const typeDefsObj = utils_1.mapObj(pgSchema.resources, def => `
      type ${def.singular} {
        ${Object.keys(def.attributes)
        .map(k => `${k}: String`) // TODO: read the schema better!
        .join('\n')}
        ${Object.values(utils_1.mapObj(def.relationships, relType)).join('\n')}
      }
    `);
    const typeDefsStr = Object.values(typeDefsObj).join(' ');
    const queryDefs = Object.values(pgSchema.resources).map(type => `
      ${type.key}: [${type.singular}]
      ${type.singular}(id: String): ${type.singular}
    `);
    const queryDefsStr = `type Query { ${queryDefs.join(' ')} }`;
    return `${typeDefsStr} ${queryDefsStr}`;
}
