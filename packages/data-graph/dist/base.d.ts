import { Query, Resource } from './types';
import { NormalizedDataGraphClass } from './normalized';
export declare class DataGraphClass {
    root: Resource | Resource[];
    query: Query;
    constructor(root: Resource | Resource[], query: Query);
    normalized(): NormalizedDataGraphClass;
}
export declare function DataGraph(root: Resource | Resource[], query: Query): DataGraphClass;
