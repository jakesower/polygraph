export interface Schema {
    resources: {
        [k: string]: SchemaResource;
    };
    title?: string;
    meta?: any;
}
export interface SchemaResource {
    key: string;
    singular?: string;
    attributes: {
        [k: string]: SchemaAttribute;
    };
    relationships: {
        [k: string]: SchemaRelationship;
    };
    meta?: any;
}
export interface SchemaAttribute {
    key: string;
    type: string;
    meta?: any;
}
export interface SchemaRelationship {
    key: string;
    cardinality: 'one' | 'many';
    type: string;
    inverse: string;
    meta?: any;
}
