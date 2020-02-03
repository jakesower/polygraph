import { ResourceGraph, Edge, ResourceGraphWithoutRelationships } from './types';
interface Decomposed extends Object {
    vertices: ResourceGraphWithoutRelationships[];
    edges: Edge[];
}
export declare function decomposeGraph(fullGraph: ResourceGraph): Decomposed;
export declare function flattenGraph(fullGraph: ResourceGraph, schema: any): {
    relationships: {
        [x: string]: any;
    };
    type: string;
    id: string;
    attributes?: {
        [k: string]: any;
    };
}[];
export {};
