"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@polygraph/utils");
function decomposeGraph(fullGraph) {
    const { type, id, relationships } = fullGraph;
    let related = { vertices: [], edges: [] };
    utils_1.forEachObj(relationships || {}, (relResources, relName) => {
        const ary = Array.isArray(relResources) ? relResources : [relResources];
        const localEdges = ary.map(r => ({
            start: { type, id },
            end: { type: r.type, id: r.id },
            type: relName,
        }));
        related.edges = localEdges;
        ary.map(decomposeGraph).forEach(d => {
            related.vertices = [...related.vertices, ...d.vertices];
            related.edges = [...related.edges, ...d.edges];
        });
    });
    // TODO: include attributes
    return { vertices: [{ type, id }, ...related.vertices], edges: related.edges };
}
exports.decomposeGraph = decomposeGraph;
function flattenGraph(fullGraph) {
    const nextRels = utils_1.mapObj(fullGraph.relationships || {}, rels => utils_1.applyOrMap(rels, ({ id, type }) => ({ id, type })));
    let out = [Object.assign(Object.assign({}, fullGraph), { relationships: nextRels })];
    utils_1.forEachObj(fullGraph.relationships || {}, (relResources, relName) => {
        const ary = Array.isArray(relResources) ? relResources : [relResources];
        ary.map(flattenGraph).forEach(d => {
            out = [...out, ...d];
        });
    });
    return out;
}
exports.flattenGraph = flattenGraph;
// export function indexGraph(fullGraph: ResourceGraph) {}
