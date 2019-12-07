import { Schema, SchemaAttribute } from './types';
export { Schema };
export declare function expandSchema(rawSchema: any): Schema;
export declare function resourceNames(schema: Schema): string[];
export declare function resourceAttributes(schema: Schema, resourceType: string): {
    [k: string]: SchemaAttribute;
};
export declare function attributeNames(schema: Schema, resourceType: string): string[];
export declare function relationshipNames(schema: Schema, resourceType: string): string[];
export declare function extractAttributes(schema: Schema, resourceType: string, obj: {
    [k: string]: any;
}): {
    [k: string]: any;
};
export declare function inverseRelationship(schema: Schema, resourceType: string, relationshipName: string): import("./types").SchemaRelationship;
export declare function canonicalRelationship(schema: Schema, resourceType: string, relationshipName: string): {
    name: string;
    locality: 'local' | 'foreign';
};
export declare function canonicalRelationshipName(schema: Schema, resourceType: string, relationshipName: string): string;
export declare function canonicalRelationshipNames(schema: Schema): string[];
export declare function isSymmetricRelationship(schema: Schema, resourceType: string, relationshipName: string): boolean;
export declare function joinTableName(relationship: any): string;
