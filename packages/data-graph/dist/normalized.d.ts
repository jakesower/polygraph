import { ResourceReference, NormalizedResource, Query } from './types';
interface NormalizedGraph {
    resources: {
        [k: string]: {
            [k: string]: NormalizedResource;
        };
    };
    root: ResourceReference | ResourceReference[];
}
declare class NormalizedDataGraphClass {
    graph: NormalizedGraph;
    query: Query;
    constructor(graph: NormalizedGraph, query: Query);
}
export declare function NormalizedDataGraph(graph: NormalizedGraph, query: Query): NormalizedDataGraphClass;
export {};
