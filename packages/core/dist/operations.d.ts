export declare const operations: {
    $and: (predicates: any) => (val: any) => any;
    $eq: (val1: any) => (val2: any) => boolean;
    $in: (vals: any) => (val: any) => any;
    $or: (predicates: any) => (val: any) => any;
};
export declare function compile(expression: any): any;
