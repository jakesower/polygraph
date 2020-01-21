import { GraphOperation, Resource, ResourceReferenceLike, RelationshipReplacement, RelationshipReplacements, DeleteInterface, MultiDeleteInterface } from './types';
interface ExternalOperations {
    create: (resourceGraph: Resource) => GraphOperation[];
    update: (resourceGraph: Resource) => GraphOperation[];
    delete: (resource: ResourceReferenceLike) => GraphOperation[];
    replaceRelationship: (resource: RelationshipReplacement) => GraphOperation[];
    replaceRelationships: (resource: RelationshipReplacements) => GraphOperation[];
    appendRelationships: (resource: RelationshipReplacements) => GraphOperation[];
    deleteRelationship: (resource: DeleteInterface) => GraphOperation[];
    deleteRelationships: (resource: MultiDeleteInterface) => GraphOperation[];
}
export declare const operationsMap: ExternalOperations;
export {};
