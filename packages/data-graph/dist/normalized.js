"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const utils_1 = require("@polygraph/utils");
class NormalizedDataGraphClass {
    constructor(graph, query) {
        this.graph = graph;
        this.query = query;
    }
    base() {
        const { graph, query } = this;
        const { root, resources } = graph;
        const expand = (queryGraph, resourceReference) => {
            if (!resourceReference)
                return null;
            if (Array.isArray(resourceReference))
                return resourceReference.map(rr => expand(queryGraph, rr));
            const { type, id } = resourceReference;
            const resource = resources[type][id];
            const relationships = utils_1.mapObj(queryGraph.relationships || {}, (relGraph, relName) => expand(relGraph, resource.relationships[relName]));
            return { type, id, attributes: resource.attributes, relationships };
        };
        return base_1.DataGraph(expand(query, root), query);
    }
}
exports.NormalizedDataGraphClass = NormalizedDataGraphClass;
function NormalizedDataGraph(graph, query) {
    return new NormalizedDataGraphClass(graph, query);
}
exports.NormalizedDataGraph = NormalizedDataGraph;
