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
const data_graph_1 = require("@polygraph/data-graph");
const utils_1 = require("@polygraph/utils");
function JsonApiStore(schema, transport) {
    // these lines are due to a flaw in axios that requires setting headers here
    transport.defaults.headers['Accept'] = 'application/vnd.api+json';
    transport.defaults.headers['Content-Type'] = 'application/vnd.api+json';
    function getOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = query;
            const params = getParams(query);
            const response = yield transport.get(`/${type}/${id}`, {
                params,
                headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
            });
            if (response.status === 404)
                return null;
            const data = response.data.data;
            const included = response.data.included || [];
            const resources = keyResources([data, ...included]);
            const dataGraph = data_graph_1.NormalizedDataGraph({
                root: data,
                resources,
            }, query);
            return dataGraph.base().root;
        });
    }
    function getMany(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield transport.get(`/${query.type}`, {
                headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
            });
            const data = response.data.data;
            const included = response.data.included || [];
            const resources = keyResources([...data, ...included]);
            const dataGraph = data_graph_1.NormalizedDataGraph({
                root: data,
                resources,
            }, query);
            return dataGraph.base().root;
        });
    }
    function keyResources(resources) {
        const extractRels = resource => utils_1.mapObj(resource.relationships, (r) => r.data);
        return resources.reduce((resources, resource) => {
            const { type, id } = resource;
            const extracted = resource.relationships
                ? Object.assign(Object.assign({}, resource), { relationships: extractRels(resource) }) : resource;
            if (!(type in resources)) {
                return Object.assign(Object.assign({}, resources), { [type]: { [id]: extracted } });
            }
            return Object.assign(Object.assign({}, resources), { [type]: Object.assign(Object.assign({}, resources[type]), { [id]: extracted }) });
        }, {});
    }
    function getParams(query) {
        // include
        const getInclude = (node, accum) => node.relationships
            ? Object.keys(node.relationships).map(r => getInclude(node.relationships[r], [...accum, r]))
            : accum.join('.');
        const include = utils_1.flatten(getInclude(query, []));
        return Object.assign({}, (include.length > 0 ? { include: include.join(',') } : {}));
    }
    return {
        get: function (query) {
            return __awaiter(this, void 0, void 0, function* () {
                return query.id ? getOne(query) : getMany(query);
            });
        },
        // TODO
        merge: function (rawGraph) {
            return __awaiter(this, void 0, void 0, function* () {
                // it ain't pretty, but it's what you get when demanding create and
                // update seperately; caching could mitigate significantly, but this is a
                // function worth avoiding on this adapter
                // throw referenceRelationships(rawGraph);
                const resourceRefs = flattenGraph(rawGraph);
                const existingResourceGraphs = yield Promise.all(resourceRefs.map(ref => getOne({ id: ref.id, type: ref.type })));
                const existingResources = existingResourceGraphs.filter(x => x !== null);
                const existingIndex = utils_1.indexOn(existingResources, ['type', 'id']);
                // TODO: Filter dup updates
                const modifications = resourceRefs.map(resource => utils_1.pathOr(existingIndex, [resource.type, resource.id], false)
                    ? this.update(resource)
                    : this.create(resource));
                return Promise.all(modifications);
            });
        },
        create: function (resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const rDefs = schema.resources[resource.type].relationships;
                const data = {
                    type: resource.type,
                    id: resource.id,
                    attributes: resource.attributes,
                    relationships: utils_1.mapObj(resource.relationships || {}, (rel, relName) => ({
                        data: { type: rDefs[relName].type, id: rel },
                    })),
                };
                return transport.post(`/${resource.type}`, { data });
            });
        },
        update: function (resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const rDefs = schema.resources[resource.type].relationships;
                const data = {
                    type: resource.type,
                    id: resource.id,
                    attributes: resource.attributes || {},
                    relationships: utils_1.mapObj(resource.relationships || {}, (rel, relName) => ({
                        data: utils_1.applyOrMap(rel, id => ({ type: rDefs[relName].type, id })),
                    })),
                };
                return transport.patch(`/${resource.type}/${resource.id}`, { data });
            });
        },
        delete: function (resource) {
            return __awaiter(this, void 0, void 0, function* () {
                return transport.delete(`/${resource.type}/${resource.id}`);
            });
        },
        replaceRelationship: function (replacement) {
            return __awaiter(this, void 0, void 0, function* () {
                const { type, id, relationship, foreignId } = replacement;
                const rDef = schema.resources[replacement.type].relationships[relationship];
                const data = utils_1.applyOrMap(foreignId, id => ({ type: rDef.type, id }));
                return transport.patch(`/${type}/${id}/relationships/${relationship}`, { data });
            });
        },
        replaceRelationships: function (replacement) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.replaceRelationship(Object.assign(Object.assign({}, replacement), { foreignId: replacement.foreignIds }));
            });
        },
        appendRelationships: function (extraRelationships) {
            return __awaiter(this, void 0, void 0, function* () {
                const { type, id, relationship, foreignIds } = extraRelationships;
                const rDef = schema.resources[extraRelationships.type].relationships[relationship];
                const data = foreignIds.map(id => ({ type: rDef.type, id }));
                return transport.post(`/${type}/${id}/relationships/${relationship}`, { data });
            });
        },
        deleteRelationship: function ({ type, id, relationship }) {
            return __awaiter(this, void 0, void 0, function* () {
                return transport.patch(`/${type}/${id}/relationships/${relationship}`, { data: null });
            });
        },
        deleteRelationships: function ({ type, id, relationship, foreignIds }) {
            return __awaiter(this, void 0, void 0, function* () {
                const rDef = schema.resources[type].relationships[relationship];
                const data = foreignIds.map(id => ({ type: rDef.type, id }));
                // the double wrapped data is on axios... :(
                return transport.delete(`/${type}/${id}/relationships/${relationship}`, { data: { data } });
            });
        },
    };
    function flattenGraph(fullGraph) {
        const rDefs = schema.resources[fullGraph.type].relationships;
        let out = [fullGraph];
        utils_1.forEachObj(fullGraph.relationships || {}, (relResources, relName) => {
            const ary = Array.isArray(relResources) ? relResources : [relResources];
            ary
                .map(id => ({ type: rDefs[relName].type, id }))
                .map(flattenGraph)
                .forEach(d => {
                out = [...out, ...d];
            });
        });
        return out;
    }
}
exports.JsonApiStore = JsonApiStore;
