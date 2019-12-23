"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NormalizedDataGraphClass {
    constructor(graph, query) {
        this.graph = graph;
        this.query = query;
    }
}
function NormalizedDataGraph(graph, query) {
    return new NormalizedDataGraphClass(graph, query);
}
exports.NormalizedDataGraph = NormalizedDataGraph;
