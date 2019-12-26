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
    function getOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = query;
            const params = getParams(query);
            const response = yield transport.get(`/${type}/${id}`, {
                params,
                headers: { 'Content-Type': 'application/vnd.api+json' },
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
                headers: { 'Content-Type': 'application/vnd.api+json' },
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
    };
}
exports.JsonApiStore = JsonApiStore;
