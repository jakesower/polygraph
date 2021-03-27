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
const query_builder_1 = require("./query-builder");
const response_parser_1 = require("./response-parser");
function polygraphql(schema, polygraphStore, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const built = yield query_builder_1.buildQuery(schema, query);
        const response = yield polygraphStore.get(built);
        return response_parser_1.parseResponse(schema, response, query);
    });
}
exports.polygraphql = polygraphql;
