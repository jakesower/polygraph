# Data Graph

This library provides some data structures for representing graphs in various useful forms and converting among them. Additionally, it includes an interface for converting commonly understood resource operations into technical graph operations. These graph operations should be easier to implement in adapters. Additionally, they are easier to compose when merge conflicts arise.

I will likely separate the interface to operations part into its own library.

**Nothing in here is aware of schemata.** As such, edges in graphs will be represented as one way. **It is up to adapter authors to ensure proper inverse connections.**

## Graph Abstractions

### Base

This is the native polygraph format. All relationships link to fully resolved resources. This makes it the easiest data structure to crawl, but also the most cumbersome on memory.

Additionally, the base abstraction must be capable of converting to any other format. Likewise, other formats must be able to convert to the base format. This allows any format to be converted into any other, even at the expense of two conversions.

_I would like to handle this via some registration process. Such a process would create a base graph factory with pairs of classes and functions to tranform base graphs into the corresponding class._

## Operations Interface

Takes resource operations and transforms them into graph operations.

### Resource Operation Lexicon

- `Resource`: Something with an id, type, attributes, and relationships represented by other `Resource`s.
- `Resource Reference`: An id and type that points to a `Resource`.
- `Normalized Resource`: An id, type, attributes, and relationships represented by `Resource Reference`s.

Additionally anything with `Like` appended to it, e.g., `ResourceLike` means an object that conforms to the underlying type, but can contain extra properties.

### Resource Operations

- Create
- Update
- Delete
- Append Relationships
- Replace Relationship
- Replace Relationships
- Delete Relationship
- Delete Relationships
- Query\*
- Merge\*\*

\* Does not have a corresponding Graph Operation (should it?)
\*\* Requires a read operation

### Graph Operation Lexicon

- `Vertex`: A vertex within a graph composed of an id, type, and attributes.
- `Edge`: An edge connecting two vertices composed of a starting vertex, an ending vertex, and a type.

Graph operations must be precise, so there are no types such as `VertexLike`.

### Graph Operations

- Add Vertex
- Update Vertex
- Remove Vertex
- Add Edge
- Remove Edge
- Remove Edges of Type

### Comments

Care should be taken to use the terms precisely. There's a great deal of overlapping concepts, but the separation of the resource-oriented terminology a user of an adapter will encounter lacks some of the desirable qualities that the more technical graph operations convey. This will hopefully accomplish two goals:

1. Ease of creating adapters. More precise graph operations should be more straightforward to implement.
1. Creation of alternative interfaces. Anything that can create graph operations can be part of an adapter.

# TODO

- Create a deterministic method of merging sets of operations. Too easy, I know. ;)
