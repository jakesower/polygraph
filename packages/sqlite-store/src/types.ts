export interface Database {
  run: (query: string, ...args: any) => Promise<any>;
  get: (query: string, ...args: any) => Promise<any>;
  all: (query: string, params: string[]) => Promise<any>;
  [k: string]: any;
}

interface QueryRelationship {
  relationships?: { [k: string]: QueryRelationship };
}

export interface Query {
  type: string;
  id?: string;
  relationships?: { [k: string]: QueryRelationship };
}

interface SingleResult {
  type: string;
  id: string;
  attributes: { [k: string]: string };
  relationships: { [k: string]: Result };
}

export type Result = SingleResult | SingleResult[];

export interface Schema {
  resources: { [k: string]: SchemaResource };
  title?: string;
  meta?: any;
}

export interface SchemaResource {
  key: string;
  attributes: { [k: string]: SchemaAttribute };
  relationships: { [k: string]: SchemaRelationship };
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

export interface ResourceGraph {
  type: string;
  id: string;
  attributes?: { [k: string]: any };
  relationships?: { [k: string]: any };
}

export interface RelationshipReplacement {
  type: string;
  id: string;
  relationship: string;
  foreignId: string;
}

export interface RelationshipReplacements {
  type: string;
  id: string;
  relationship: string;
  foreignIds: string[];
}

interface DeleteInterface {
  type: string;
  id: string;
  relationship: string;
}

interface MultiDeleteInterface extends DeleteInterface {
  foreignIds: string[];
}

export interface Store {
  get: (query: Query) => Promise<Result>;
  merge: (resourceGraph: ResourceGraph) => Promise<any>;
  delete: (resource: ResourceGraph) => Promise<any>;
  replaceRelationship: (resource: RelationshipReplacement) => Promise<any>;
  replaceRelationships: (resource: RelationshipReplacements) => Promise<any>;
  appendRelationships: (resource: RelationshipReplacements) => Promise<any>;
  deleteRelationship: (resource: DeleteInterface) => Promise<any>;
  deleteRelationships: (resource: MultiDeleteInterface) => Promise<any>;
}
