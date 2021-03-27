"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = {
    $and: predicates => val => predicates.every(predicate => predicate(val)),
    $eq: val1 => val2 => val1 === val2,
    $in: vals => val => vals.includes(val),
    $or: predicates => val => predicates.some(predicate => compile(predicate)(val)),
};
function compile(expression) {
    const k = Object.keys(expression)[0];
    const operation = exports.operations[k];
    return operation(expression[k]);
}
exports.compile = compile;
