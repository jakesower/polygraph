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
  relationships: { [k: string]: Resource | Resource[] };
}

export interface ResourceLike extends Resource {
  [k: string]: any;
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
