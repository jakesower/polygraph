import { ResourceReference, NormalizedResource, Query } from './types';
import { DataGraphClass } from './base';
interface NormalizedGraph {
    resources: {
        [k: string]: {
            [k: string]: NormalizedResource;
        };
    };
    root: ResourceReference | ResourceReference[];
}
export declare class NormalizedDataGraphClass {
    graph: NormalizedGraph;
    query: Query;
    constructor(graph: NormalizedGraph, query: Query);
    base(): DataGraphClass;
}
export declare function NormalizedDataGraph(graph: NormalizedGraph, query: Query): NormalizedDataGraphClass;
export {};
