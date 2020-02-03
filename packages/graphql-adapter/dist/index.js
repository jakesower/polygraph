"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStore = MemoryStore;

var _schemaUtils = require("@polygraph/schema-utils");

var _utils = require("@polygraph/utils");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function MemoryStore(schema, baseState) {
  var baseObjects = (0, _utils.fillObject)((0, _schemaUtils.resourceNames)(schema), {});
  var baseRelationships = (0, _utils.fillObject)((0, _schemaUtils.canonicalRelationshipNames)(schema), []);
  var state = {
    objects: (0, _utils.mergeChildren)(baseObjects, baseState.objects || {}),
    relationships: (0, _utils.assignChildren)([baseRelationships, baseState.relationships || {}])
  };
  return {
    get: get,
    merge: merge,
    delete: delete_,
    appendRelationships: appendRelationships,
    replaceRelationship: function replaceRelationship(args) {
      return replaceRelationships(_objectSpread({}, args, {
        foreignIds: [args.foreignId]
      }));
    },
    replaceRelationships: replaceRelationships,
    deleteRelationship: deleteRelationship,
    deleteRelationships: deleteRelationships
  }; // Main actions

  function get(query) {
    return 'id' in query ? getOne(query) : getMany(query);
  } // As of now, support the same stuff that JSONAPI supports. Namely, only a
  // single object can be touched in a merge call. This should be revisited.


  function merge(resource) {
    var id = resource.id,
        type = resource.type;
    var base = state.objects[type][id] || {};
    state.objects[type][id] = _objectSpread({}, base, {}, resource.attributes);
    (0, _utils.mapObj)(resource.relationships || {}, function (relationships, relationshipName) {
      var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

      var _canonicalRelationshi = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
          relationshipKey = _canonicalRelationshi.name,
          locality = _canonicalRelationshi.locality;

      var filt = reflexive ? function (arrow) {
        return arrow.local !== id && arrow.foreign !== id;
      } : function (arrow) {
        return arrow[locality] !== id;
      };
      var withoutExisting = state.relationships[relationshipKey].filter(filt);
      var toAdd = (Array.isArray(relationships) ? relationships : [relationships]).map(function (f) {
        return locality === 'local' ? {
          local: id,
          foreign: f
        } : {
          local: f,
          foreign: id
        };
      });
      state.relationships[relationshipKey] = [].concat(_toConsumableArray(withoutExisting), _toConsumableArray(toAdd));
    });
  }

  function delete_(resource) {
    var id = resource.id,
        type = resource.type;
    var definition = schema.resources[type];
    delete state.objects[type][id];
    Object.keys(definition.relationships).forEach(function (relationshipName) {
      var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

      var _canonicalRelationshi2 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
          relationshipKey = _canonicalRelationshi2.name,
          locality = _canonicalRelationshi2.locality;

      var filt = reflexive ? function (arrow) {
        return arrow.local !== id && arrow.foreign !== id;
      } : function (arrow) {
        return arrow[locality] !== id;
      };
      state.relationships[relationshipKey] = state.relationships[relationshipKey].filter(filt);
    });
  }

  function appendRelationships(_ref) {
    var type = _ref.type,
        id = _ref.id,
        foreignIds = _ref.foreignIds,
        relationshipName = _ref.relationship;
    var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

    var _canonicalRelationshi3 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
        relationshipKey = _canonicalRelationshi3.name,
        locality = _canonicalRelationshi3.locality;

    var inverseLocality = locality === 'foreign' ? 'local' : 'foreign';
    var excluder = reflexive ? function (arrow) {
      return arrow.local === id && foreignIds.includes(arrow.foreign) || arrow.foreign === id && foreignIds.includes(arrow.local);
    } : function (arrow) {
      return arrow[locality] === id && foreignIds.includes(arrow[inverseLocality]);
    };
    var withoutDups = state.relationships[relationshipKey].filter(function (v) {
      return !excluder(v);
    });
    var toAdd = foreignIds.map(function (f) {
      return locality === 'local' ? {
        local: id,
        foreign: f
      } : {
        local: f,
        foreign: id
      };
    });
    state.relationships[relationshipKey] = [].concat(_toConsumableArray(withoutDups), _toConsumableArray(toAdd));
  }

  function replaceRelationships(_ref2) {
    var type = _ref2.type,
        id = _ref2.id,
        foreignIds = _ref2.foreignIds,
        relationshipName = _ref2.relationship;
    var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

    var _canonicalRelationshi4 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
        relationshipKey = _canonicalRelationshi4.name,
        locality = _canonicalRelationshi4.locality;

    var filt = reflexive ? function (arrow) {
      return arrow.local !== id && arrow.foreign !== id;
    } : function (arrow) {
      return arrow[locality] !== id;
    };
    var withoutExisting = state.relationships[relationshipKey].filter(filt);
    var toAdd = foreignIds.map(function (f) {
      return locality === 'local' ? {
        local: id,
        foreign: f
      } : {
        local: f,
        foreign: id
      };
    });
    state.relationships[relationshipKey] = [].concat(_toConsumableArray(withoutExisting), _toConsumableArray(toAdd));
  }

  function deleteRelationship(_ref3) {
    var type = _ref3.type,
        id = _ref3.id,
        relationshipName = _ref3.relationship;
    var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

    var _canonicalRelationshi5 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
        relationshipKey = _canonicalRelationshi5.name,
        locality = _canonicalRelationshi5.locality;

    var filt = reflexive ? function (arrow) {
      return arrow.local !== id && arrow.foreign !== id;
    } : function (arrow) {
      return arrow[locality] !== id;
    };
    var withoutTargeted = state.relationships[relationshipKey].filter(filt);
    state.relationships[relationshipKey] = withoutTargeted;
  }

  function deleteRelationships(_ref4) {
    var type = _ref4.type,
        id = _ref4.id,
        foreignIds = _ref4.foreignIds,
        relationshipName = _ref4.relationship;
    var reflexive = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName);

    var _canonicalRelationshi6 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
        relationshipKey = _canonicalRelationshi6.name,
        locality = _canonicalRelationshi6.locality;

    var inverseLocality = locality === 'foreign' ? 'local' : 'foreign';
    var excluder = reflexive ? arrow.local === id && foreignIds.includes(arrow.foreign) || arrow.foreign === id && foreignIds.includes(arrow.local) : function (arrow) {
      return arrow[locality] === id && foreignIds.includes(arrow[inverseLocality]);
    };
    var withoutTargeted = state.relationships[relationshipKey].filter(function (v) {
      return !excluder(v);
    });
    state.relationships[relationshipKey] = withoutTargeted;
  } // Helpers


  function getOne(query) {
    var type = query.type,
        id = query.id;
    var root = state.objects[type][id];

    if (!root) {
      return null;
    }

    var relationships = (0, _utils.mapObj)(query.relationships || {}, function (options, relationshipName) {
      return expandRelationship(query, relationshipName, options);
    });
    return {
      id: id,
      type: type,
      attributes: root,
      relationships: relationships
    };
  }

  function getMany(query) {
    return Object.values((0, _utils.mapObj)(state.objects[query.type], function (_, id) {
      return getOne({
        type: query.type,
        id: id,
        relationships: query.relationships
      });
    }));
  }

  function expandRelationship(query, relationshipName, options) {
    var type = query.type,
        id = query.id;
    var relationshipDefinition = schema.resources[type].relationships[relationshipName];

    var _canonicalRelationshi7 = (0, _schemaUtils.canonicalRelationship)(schema, type, relationshipName),
        relationshipType = _canonicalRelationshi7.name,
        locality = _canonicalRelationshi7.locality;

    var pool = state.relationships[relationshipType];
    var inverseLocality = locality === 'local' ? 'foreign' : 'local'; // three possibilities: reflexive, local, foreign

    var finder = (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName) ? function (relArrow) {
      return relArrow.local === id || relArrow.foreign === id;
    } : function (relArrow) {
      return relArrow[locality] === id;
    };

    var expand = function expand(hit) {
      return (0, _schemaUtils.isReflexiveRelationship)(schema, type, relationshipName) ? getOne({
        id: hit.local === id ? hit.foreign : hit.local,
        type: relationshipDefinition.type,
        relationships: options.relationships
      }) : getOne({
        id: hit[inverseLocality],
        type: relationshipDefinition.type,
        relationships: options.relationships
      });
    };

    if (relationshipDefinition.cardinality === 'one') {
      var found = (0, _utils.findObj)(pool, finder);
      return found ? expand(found) : null;
    }

    return Object.values((0, _utils.filterObj)(pool, finder)).map(expand);
  }
}