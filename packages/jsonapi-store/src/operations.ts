export function runOperation(operation, transport) {
  const handlers = {
    AddVertex: create,
    UpdateVertex: update,
    RemoveVertex: delete_,
    AddEdge: addEdge,
    RemoveEdge: removeEdge,
    RemoveEdgesOfType: removeEdgesOfType,
  };

  return handlers[operation.operation](operation);

  async function create({ type, id, attributes }) {
    return transport.post(`/${type}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },

      data: {
        data: { type, id, attributes },
      },
    });
  }

  async function update({ type, id, attributes }) {
    return transport.patch(`/${type}/${id}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      data: {
        data: { type, id, attributes },
      },
    });
  }

  async function delete_({ type, id }) {
    return transport.delete(`/${type}/${id}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      data: {
        data: { type, id },
      },
    });
  }

  async function addEdge({ start, end, type }) {
    return transport.post(`/${start.type}/${start.id}/relationships/${type}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      data: {
        data: [end],
      },
    });
  }

  async function removeEdge({ start, end, type }) {
    return transport.delete(`/${start.type}/${start.id}/relationships/${type}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      data: {
        data: [end],
      },
    });
  }

  async function removeEdgesOfType({ vertex, type }) {
    return transport.delete(`/${vertex.type}/${vertex.id}/relationships/${type}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      data: {
        data: [],
      },
    });
  }
}
