declare type Ord = number | string | boolean | Date;
export declare function appendKeys<T, K extends keyof T>(base: {
    [k: string]: T[K][];
}, other: {
    [k: string]: T[K][];
}): {
    [k: string]: T[K][];
};
export declare function assignChildren(objs: {
    [k: string]: {
        [k: string]: any;
    };
}[]): {
    [k: string]: {
        [k: string]: any;
    };
};
export declare function chainPipeThru(val: any, fns: ((x: any) => any)[]): any;
export declare function cmp(a: Ord, b: Ord): number;
export declare function fgo(generator: any): any;
export declare function fillObject<T>(keys: string[], value: T): {
    [k: string]: T;
};
export declare function filterObj<T>(obj: {
    [k: string]: T;
}, predicateFn: (x: T) => boolean): {
    [k: string]: T;
};
export declare function findObj<T>(obj: {
    [k: string]: T;
}, predicateFn: (x: T) => boolean): T | null;
export declare function flatMap<T>(xs: T[], fn: (x: T) => T[]): T[];
export declare function inlineKey<T, K extends keyof T>(obj: T): {
    [k: string]: T[K] & {
        key: string;
    };
};
export declare function mapObj<T, U>(obj: {
    [k in string]: T;
}, fn: (x: T, idx: string) => U): {
    [k in string]: U;
};
export declare function mapObjToArray<T, U>(obj: {
    [k in string]: T;
}, fn: (x: T, idx: string) => U): U[];
export declare function maxStable<T>(fn: (a: T) => Ord, xs: T[]): T;
export declare function mapResult(resultOrResults: any, fn: any): any;
export declare function mergeAll<T>(items: {
    [k in string]: T;
}[]): {
    [k in string]: T;
};
export declare function mergeChildren(obj: {
    [k: string]: {
        [k: string]: any;
    };
}, ext: {
    [k: string]: {
        [k: string]: any;
    };
}): {
    [k: string]: {
        [k: string]: any;
    };
};
export declare function overPath(obj: any, path: any, fn: any): any;
export declare function omitKeys<T>(obj: {
    [k: string]: T;
}, nix: string[]): {
    [k: string]: T;
};
export declare function parseQueryParams(rawParams: any): {};
export declare function pick<T>(obj: {
    [k: string]: T;
}, keys: string[]): {
    [k: string]: T;
};
export declare function pipe(fns: ((x: any) => any)[]): (x: any) => any;
export declare function pipeMw(init: any, mws: any): Promise<any>;
export declare function pipeThru(val: any, fns: ((x: any) => any)[]): any;
export declare function pluckKeys<T>(obj: {
    [k: string]: T;
}, keep: string[]): {
    [k: string]: T;
};
export declare function reduceObj<T, U>(obj: {
    [k: string]: T;
}, init: U, reducer: (acc: U, v: T, k: string) => U): U;
export declare function sortBy<T>(fn: (a: T, b: T) => number, xs: T[]): T[];
export declare function sortByAll<T>(fns: ((a: T, b: T) => number)[], xs: T[]): T[];
export declare function sortWith<T>(fn: (a: T) => Ord, xs: T[]): T[];
export declare function sortWithAll<T>(fns: ((a: T) => Ord)[], xs: T[]): T[];
export declare function uniq<T>(xs: T[]): T[];
export declare function unnest<T>(xs: T[][]): T[];
export declare function xprod<T, U>(xs: T[], ys: U[]): [T, U][];
export declare function zipObj<T>(keys: string[], vals: T[]): {
    [k: string]: T;
};
export {};
