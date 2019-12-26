"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@polygraph/utils");
const normalized_1 = require("./normalized");
/*
 * Possible forms:
 *
 * PG base (fully expanded over a query)
 * Normalized (resources once with references)
 * Graph (edges and vertices)
 * Verteces with edges (double referenced from each connected resource)
 * Compressed (for transport)
 */
// function applyOrMap<T, U>(maybeArray: T, fn: (arg: T) => U): U;
// function applyOrMap<T, U>(maybeArray: T[], fn: (arg: T) => U): U[] {
function applyOrMap(maybeArray, fn) {
    return Array.isArray(maybeArray) ? maybeArray.map(fn) : fn(maybeArray);
}
class DataGraphClass {
    constructor(root, query) {
        this.root = root;
        this.query = query;
    }
    // TODO: cache
    normalized() {
        const { root, query } = this;
        let resources = {};
        const makeRef = (vs) => applyOrMap(vs, r => ({ type: r.type, id: r.id }));
        const normalizedRoot = makeRef(root);
        const extract = (resource) => {
            const { type, id } = resource;
            const relationships = resource.relationships;
            resources[type] = resources[type] || {};
            const relationshipRefs = utils_1.mapObj(relationships, makeRef);
            const prevRels = resources[type][id] ? resources[type][id].relationships : {};
            const nextRels = utils_1.mergeWith(prevRels, relationshipRefs, (prev, cur) => Array.isArray(prev) && Array.isArray(cur) ? utils_1.uniqBy([...prev, ...cur], x => x.id) : prev);
            Object.values(relationships).forEach(rel => applyOrMap(rel, extract));
            resources[type][id] = Object.assign(Object.assign({}, resource), { relationships: nextRels });
        };
        applyOrMap(root, extract);
        return normalized_1.NormalizedDataGraph({ root: normalizedRoot, resources }, query);
    }
}
exports.DataGraphClass = DataGraphClass;
function DataGraph(root, query) {
    return new DataGraphClass(root, query);
}
exports.DataGraph = DataGraph;
