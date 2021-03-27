"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@polygraph/utils");
const operations_1 = require("./operations");
// TODO - Allow user to provide operations
function BaseStore(schema) {
    return {
        filter(resources, filterExps = {}) {
            const filterKeys = Object.keys(filterExps);
            const checks = utils_1.mapObj(filterExps, expression => operations_1.compile(expression));
            const filterFns = filterKeys.map(filterKey => resource => checks[filterKey](filterKey === 'id' ? resource.id : resource.attributes[filterKey]));
            return resources.filter(resource => filterFns.every(filterFn => filterFn(resource)));
        },
    };
}
exports.BaseStore = BaseStore;
