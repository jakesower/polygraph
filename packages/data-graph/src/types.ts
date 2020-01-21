export interface QueryRelationship {
  relationships?: { [k: string]: QueryRelationship };
}

export interface Query {
  type: string;
  id?: string;
  relationships?: { [k: string]: QueryRelationship };
}

export interface Resource {
  type: string;
  id: string;
  attributes: { [k: string]: any };
  relationships?: { [k: string]: Resource | Resource[] };
}

export interface ResourceLike extends Resource {
  [k: string]: any;
}

export interface ResourceGraph {
  type: string;
  id: string;
  attributes?: { [k: string]: any };
  relationships?: { [k: string]: ResourceGraph | ResourceGraph[] };
}

export interface NormalizedResource {
  type: string;
  id: string;
  attributes: { [k: string]: any };
  relationships: { [k: string]: ResourceReference | ResourceReference[] };
}

export interface ResourceReference {
  type: string;
  id: string;
}

export interface ResourceGraphWithoutRelationships {
  type: string;
  id: string;
  attributes?: { [k: string]: any };
}

export interface VertexReference {
  type: string;
  id: string;
}

export interface Vertex extends VertexReference {
  attributes: { [k: string]: any };
}

export interface Edge {
  start: VertexReference;
  end: VertexReference;
  type: string;
}

export interface RelationshipReplacement {
  resource: ResourceReferenceLike;
  target: ResourceReferenceLike;
  type: string;
}

export interface RelationshipReplacements {
  resource: ResourceReferenceLike;
  targets: ResourceReferenceLike[];
  type: string;
}

export interface DeleteInterface {
  resource: ResourceReferenceLike;
  type: string;
}

export interface MultiDeleteInterface extends DeleteInterface {
  foreignIds: string[];
}

export interface ResourceReferenceLike extends ResourceReference {
  [k: string]: any;
}

export interface AddVertexOperation {
  operation: 'AddVertex';
  type: string;
  id: string;
  attributes: { [k: string]: any };
}

export interface UpdateVertexOperation {
  operation: 'UpdateVertex';
  type: string;
  id: string;
  attributes: { [k: string]: any };
}

export interface RemoveVertexOperation {
  operation: 'RemoveVertex';
  vertex: ResourceReference;
}

export interface AddEdgeOperation {
  operation: 'AddEdge';
  start: ResourceReference;
  end: ResourceReference;
  type: string;
}

export interface RemoveEdgeOperation {
  operation: 'RemoveEdge';
  start: ResourceReference;
  end: ResourceReference;
  type: string;
}

export interface RemoveEdgesOfTypeOperation {
  operation: 'RemoveEdgesOfType';
  vertex: ResourceReference;
  type: string;
}

export type GraphOperation =
  | AddEdgeOperation
  | AddVertexOperation
  | UpdateVertexOperation
  | RemoveEdgeOperation
  | RemoveEdgesOfTypeOperation
  | RemoveVertexOperation;
