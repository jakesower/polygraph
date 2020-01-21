"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@polygraph/utils");
function ref(resourceLike) {
    return { type: resourceLike.type, id: resourceLike.id };
}
exports.operationsMap = {
    create({ type, id, attributes, relationships }) {
        const relOpsObj = utils_1.mapObj(relationships || {}, (relResources, relName) => {
            const ary = Array.isArray(relResources) ? relResources : [relResources];
            return ary.map(r => ({
                operation: 'AddEdge',
                start: { type, id },
                end: ref(r),
                type: relName,
            }));
        });
        const relOps = Object.values(relOpsObj).reduce((a, b) => [...a, ...b], []);
        return [{ operation: 'AddVertex', type, id, attributes }, ...relOps];
    },
    update({ type, id, attributes, relationships }) {
        const typesToReplace = Object.keys(relationships || {});
        const relOpsObj = utils_1.mapObj(relationships || {}, (relResources, relName) => {
            const ary = Array.isArray(relResources) ? relResources : [relResources];
            return ary.map(r => ({
                operation: 'AddEdge',
                start: { type, id },
                end: ref(r),
                type: relName,
            }));
        });
        const relOps = Object.values(relOpsObj).reduce((a, b) => [...a, ...b], []);
        return [{ operation: 'AddVertex', type, id, attributes }, ...relOps];
    },
    delete(resource) {
        return [{ operation: 'RemoveVertex', vertex: ref(resource) }];
    },
    replaceRelationship({ resource, target, type }) {
        return [
            { operation: 'RemoveEdgesOfType', vertex: ref(resource), type },
            { operation: 'AddEdge', start: ref(resource), end: ref(target), type },
        ];
    },
    replaceRelationships(replacements) {
        const { resource, targets, type } = replacements;
        const edgeOps = targets.map(target => ({
            operation: 'AddEdge',
            start: ref(resource),
            end: ref(target),
            type,
        }));
        return [{ operation: 'RemoveEdgesOfType', vertex: ref(resource), type }, ...edgeOps];
    },
    appendRelationships(replacements) {
        const { resource, targets, type } = replacements;
        const edgeOps = targets.map(target => ({
            operation: 'AddEdge',
            start: ref(resource),
            end: ref(target),
            type: type,
        }));
        return edgeOps;
    },
    deleteRelationship({ resource, type }) {
        return [{ operation: 'RemoveEdgesOfType', vertex: resource, type }];
    },
    deleteRelationships(x) {
        return this.deleteRelationship(x);
    },
};
