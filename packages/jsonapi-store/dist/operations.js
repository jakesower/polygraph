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
function runOperation(operation, transport) {
    const handlers = {
        AddVertex: create,
        UpdateVertex: update,
        RemoveVertex: delete_,
        AddEdge: addEdge,
        RemoveEdge: removeEdge,
        RemoveEdgesOfType: removeEdgesOfType,
    };
    return handlers[operation.operation](operation);
    function create({ type, id, attributes }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.post(`/${type}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: { type, id, attributes },
                },
            });
        });
    }
    function update({ type, id, attributes }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.patch(`/${type}/${id}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: { type, id, attributes },
                },
            });
        });
    }
    function delete_({ type, id }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.delete(`/${type}/${id}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: { type, id },
                },
            });
        });
    }
    function addEdge({ start, end, type }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.post(`/${start.type}/${start.id}/relationships/${type}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: [end],
                },
            });
        });
    }
    function removeEdge({ start, end, type }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.delete(`/${start.type}/${start.id}/relationships/${type}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: [end],
                },
            });
        });
    }
    function removeEdgesOfType({ vertex, type }) {
        return __awaiter(this, void 0, void 0, function* () {
            return transport.delete(`/${vertex.type}/${vertex.id}/relationships/${type}`, {
                headers: { 'Content-Type': 'application/vnd.api+json' },
                data: {
                    data: [],
                },
            });
        });
    }
}
exports.runOperation = runOperation;
