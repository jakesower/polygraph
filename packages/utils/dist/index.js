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
function append(xs, ys) {
    return [...xs, ...ys];
}
exports.append = append;
function appendKeys(base, other) {
    const keys = uniq([...Object.keys(base), ...Object.keys(other)]);
    let result = {};
    for (let key of keys) {
        result[key] = [...(base[key] || []), ...(other[key] || [])];
    }
    return result;
}
exports.appendKeys = appendKeys;
function applyOrMap(maybeArray, fn) {
    return Array.isArray(maybeArray) ? maybeArray.map(fn) : fn(maybeArray);
}
exports.applyOrMap = applyOrMap;
function assignChildren(objs) {
    let out = {};
    objs.forEach(obj => {
        for (let k of Object.keys(obj)) {
            out[k] = obj[k];
        }
    });
    return out;
}
exports.assignChildren = assignChildren;
function chainPipeThru(val, fns) {
    return fns.reduce((acc, fn) => acc.chain(fn), val);
}
exports.chainPipeThru = chainPipeThru;
function cmp(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
exports.cmp = cmp;
function fgo(generator) {
    const recur = ({ value, done }, gen) => {
        if (done) {
            return value;
        }
        return value.chain(v => recur(gen.next(v), gen));
    };
    let g = generator();
    return recur(g.next(), g);
}
exports.fgo = fgo;
function fillObject(keys, value) {
    const l = keys.length;
    let out = {};
    for (let i = 0; i < l; i += 1) {
        out[keys[i]] = value;
    }
    return out;
}
exports.fillObject = fillObject;
function filterObj(obj, predicateFn) {
    let out = {};
    for (const key of Object.keys(obj)) {
        if (predicateFn(obj[key])) {
            out[key] = obj[key];
        }
    }
    return out;
}
exports.filterObj = filterObj;
function findObj(obj, predicateFn) {
    for (const key of Object.keys(obj)) {
        if (predicateFn(obj[key])) {
            return obj[key];
        }
    }
    return null;
}
exports.findObj = findObj;
function flatMap(xs, fn) {
    return makeFlat(xs.map(fn), false);
}
exports.flatMap = flatMap;
function forEachObj(obj, fn) {
    const keys = Object.keys(obj);
    keys.forEach(k => fn(obj[k], k));
}
exports.forEachObj = forEachObj;
function flatten(xs) {
    return makeFlat(xs, true);
}
exports.flatten = flatten;
function indexOn(xs, keys) {
    let out = {};
    const [first, ...rest] = keys;
    if (rest.length === 0) {
        for (let x of xs) {
            out[x[first]] = x;
        }
        return out;
    }
    for (let x of xs) {
        const k = x[first];
        out[k] = out[k] || [];
        out[k][out[k].length] = x;
    }
    return mapObj(out, ys => indexOn(ys, rest));
}
exports.indexOn = indexOn;
// e.g. {a: {inner: 'thing'}, b: {other: 'item'}} => {a: {key: 'a', inner: 'thing'}, b: {key: 'b', other: 'item'}}
function inlineKey(obj) {
    let result = {};
    const keys = Object.keys(obj);
    for (let key of keys) {
        result[key] = Object.assign({}, obj[key], { key });
    }
    return result;
}
exports.inlineKey = inlineKey;
function mapObj(obj, fn) {
    const [keys, vals] = [Object.keys(obj), Object.values(obj)];
    const mappedVals = vals.map((v, idx) => fn(v, keys[idx]));
    return zipObj(keys, mappedVals);
}
exports.mapObj = mapObj;
function mapObjToArray(obj, fn) {
    const [keys, vals] = [Object.keys(obj), Object.values(obj)];
    const mappedVals = vals.map((v, idx) => fn(v, keys[idx]));
    return mappedVals;
}
exports.mapObjToArray = mapObjToArray;
function maxStable(fn, xs) {
    const l = xs.length;
    let out = xs[0];
    let outVal = fn(out);
    for (let i = 1; i < l; i += 1) {
        const cur = xs[i];
        const curVal = fn(cur);
        if (curVal > outVal) {
            out = cur;
            outVal = curVal;
        }
    }
    return out;
}
exports.maxStable = maxStable;
function mapResult(resultOrResults, fn) {
    if (resultOrResults === null) {
        return null;
    }
    if (Array.isArray(resultOrResults)) {
        return resultOrResults.map(r => mapResult(r, fn));
    }
    const next = fn(resultOrResults);
    const relationships = mapObj(resultOrResults.relationships, r => mapResult(r, fn));
    return Object.assign(Object.assign({}, next), { relationships });
}
exports.mapResult = mapResult;
function mergeAll(items) {
    const init = {};
    return items.reduce((merged, arg) => (Object.assign(Object.assign({}, merged), arg)), init);
}
exports.mergeAll = mergeAll;
function mergeChildren(obj, ext) {
    const ks = uniq([...Object.keys(obj), ...Object.keys(ext)]);
    const l = ks.length;
    let out = {};
    for (let i = 0; i < l; i += 1) {
        out[ks[i]] = Object.assign(Object.assign({}, (obj[ks[i]] || {})), (ext[ks[i]] || {}));
    }
    return out;
}
exports.mergeChildren = mergeChildren;
function mergeWith(base, other, combiner) {
    const keys = uniq([...Object.keys(base), ...Object.keys(other)]);
    let result = {};
    for (let key of keys) {
        result[key] = !(key in base)
            ? other[key]
            : !(key in other)
                ? base[key]
                : combiner(base[key], other[key]);
    }
    return result;
}
exports.mergeWith = mergeWith;
function overPath(obj, path, fn) {
    if (path.length === 0) {
        return null;
    }
    const [head, ...tail] = path;
    if (path.length === 1) {
        return Object.assign(Object.assign({}, obj), { [head]: fn(obj[head]) });
    }
    return Object.assign(Object.assign({}, obj), { [head]: overPath(obj[head], tail, fn) });
}
exports.overPath = overPath;
function omitKeys(obj, nix) {
    let out = {};
    for (let key of Object.keys(obj)) {
        if (!nix.includes(key)) {
            out[key] = obj[key];
        }
    }
    return out;
}
exports.omitKeys = omitKeys;
function parseQueryParams(rawParams) {
    let out = {};
    const indexRegex = /^([^[]+)\[([^\]]+)\]$/;
    Object.keys(rawParams).forEach(k => {
        const res = indexRegex.exec(k);
        if (res) {
            const [top, inner] = [res[1], res[2]];
            out[top] = out[top] || {};
            out[top][inner] = rawParams[k];
        }
        else {
            out[k] = rawParams[k];
        }
    });
    return out;
}
exports.parseQueryParams = parseQueryParams;
function pathOr(obj, path, otherwise) {
    if (path.length === 0)
        return true;
    const [first, ...rest] = path;
    return first in obj ? pathOr(obj[first], rest, otherwise) : otherwise;
}
exports.pathOr = pathOr;
function pick(obj, keys) {
    const l = keys.length;
    let out = {};
    for (let i = 0; i < l; i += 1) {
        if (keys[i] in obj)
            out[keys[i]] = obj[keys[i]];
    }
    return out;
}
exports.pick = pick;
function pipe(fns) {
    return fns.reduce((acc, fn) => val => fn(acc(val)), x => x);
}
exports.pipe = pipe;
function pipeMw(init, mws) {
    return __awaiter(this, void 0, void 0, function* () {
        if (mws.length === 0) {
            return init;
        }
        const fn = mws.reverse().reduce((onion, mw) => {
            return (req) => __awaiter(this, void 0, void 0, function* () { return yield mw(req, onion); });
        });
        return fn(init);
    });
}
exports.pipeMw = pipeMw;
function pipeThru(val, fns) {
    return pipe(fns)(val);
}
exports.pipeThru = pipeThru;
function pluckKeys(obj, keep) {
    let out = {};
    for (let key of keep) {
        if (key in obj) {
            out[key] = obj[key];
        }
    }
    return out;
}
exports.pluckKeys = pluckKeys;
function reduceObj(obj, init, reducer) {
    return Object.keys(obj).reduce((acc, key) => reducer(acc, obj[key], key), init);
}
exports.reduceObj = reduceObj;
function sortBy(fn, xs) {
    if (xs.length === 0) {
        return [];
    }
    const first = xs[0];
    const rest = xs.slice(1);
    let lts = [];
    let gts = [];
    let eqs = [first];
    for (let i = 0; i < rest.length; i += 1) {
        const comp = fn(rest[i], first);
        if (comp > 0) {
            gts.push(rest[i]);
        }
        else if (comp === 0) {
            eqs.push(rest[i]);
        }
        else {
            lts.push(rest[i]);
        }
    }
    return sortBy(fn, lts)
        .concat(eqs)
        .concat(sortBy(fn, gts));
}
exports.sortBy = sortBy;
function sortByAll(fns, xs) {
    if (fns.length === 0 || xs.length <= 1) {
        return xs;
    }
    const [fn, ...restFns] = fns;
    const [first, ...rest] = xs;
    let lts = [];
    let gts = [];
    let eqs = [first];
    for (let i = 0; i < rest.length; i += 1) {
        const comp = fn(rest[i], first);
        if (comp > 0) {
            gts.push(rest[i]);
        }
        else if (comp === 0) {
            eqs.push(rest[i]);
        }
        else {
            lts.push(rest[i]);
        }
    }
    return [...sortByAll(fns, lts), ...sortByAll(restFns, eqs), ...sortByAll(fns, gts)];
}
exports.sortByAll = sortByAll;
function sortWith(fn, xs) {
    if (xs.length === 0) {
        return [];
    }
    const first = xs[0];
    const fx = fn(first);
    const rest = xs.slice(1);
    let lts = [];
    let gts = [];
    let eqs = [first];
    for (let i = 0; i < rest.length; i += 1) {
        const fy = fn(rest[i]);
        if (fy > fx) {
            gts.push(rest[i]);
        }
        else if (fy < fx) {
            lts.push(rest[i]);
        }
        else {
            eqs.push(rest[i]);
        }
    }
    return sortWith(fn, lts)
        .concat(eqs)
        .concat(sortWith(fn, gts));
}
exports.sortWith = sortWith;
function sortWithAll(fns, xs) {
    if (fns.length === 0 || xs.length <= 1) {
        return xs;
    }
    const fn = fns[0];
    const restFns = fns.slice(1);
    const first = xs[0];
    const fx = fn(first);
    const rest = xs.slice(1);
    let lts = [];
    let gts = [];
    let eqs = [first];
    for (let i = 0; i < rest.length; i += 1) {
        // TODO: reduce this over fns (start with 0, exit on non-zero)
        const fy = fn(rest[i]);
        if (fy > fx) {
            gts.push(rest[i]);
        }
        else if (fy < fx) {
            lts.push(rest[i]);
        }
        else {
            eqs.push(rest[i]);
        }
    }
    return [...sortWithAll(fns, lts), ...sortWithAll(restFns, eqs), ...sortWithAll(fns, gts)];
}
exports.sortWithAll = sortWithAll;
function uniq(xs) {
    return [...new Set(xs)];
}
exports.uniq = uniq;
function uniqBy(xs, fn) {
    let hits = new Set();
    let out = [];
    for (const x of xs) {
        const key = fn(x);
        if (!hits.has(key)) {
            hits.add(key);
            out[out.length] = x;
        }
    }
    return out;
}
exports.uniqBy = uniqBy;
function unnest(xs) {
    return makeFlat(xs, false);
}
exports.unnest = unnest;
function xprod(xs, ys) {
    const xl = xs.length;
    const yl = ys.length;
    let out = [];
    for (let i = 0; i < xl; i += 1) {
        for (let j = 0; j < yl; j += 1) {
            out[out.length] = [xs[i], ys[j]];
        }
    }
    return out;
}
exports.xprod = xprod;
function zipObj(keys, vals) {
    return keys.reduce((out, key, idx) => {
        const o = { [key]: vals[idx] };
        return Object.assign(Object.assign({}, out), o);
    }, {});
}
exports.zipObj = zipObj;
function makeFlat(list, recursive) {
    let result = [];
    let idx = 0;
    let ilen = list.length;
    while (idx < ilen) {
        if (Array.isArray(list[idx])) {
            let value = recursive ? makeFlat(list[idx], true) : list[idx];
            let j = 0;
            let jlen = value.length;
            while (j < jlen) {
                result[result.length] = value[j];
                j += 1;
            }
        }
        else {
            result[result.length] = list[idx];
        }
        idx += 1;
    }
    return result;
}
