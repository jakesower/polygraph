import { NormalizedDataGraph } from '@polygraph/data-graph';
import { Schema, Store, Query } from './types';
import {
  flatten,
  mapObj,
  applyOrMap,
  indexOn,
  pathOr,
  forEachObj,
  omitKeys,
} from '@polygraph/utils';
import { RelationshipReplacement } from '@polygraph/data-graph/dist/types';

import { compile } from './operations';

// TODO - Allow user to provide operations
export function BaseStore(schema: Schema) {
  return {
    filter(resources, filterExps = {}) {
      const filterKeys = Object.keys(filterExps);
      const checks = mapObj(filterExps, expression => compile(expression));
      const filterFns = filterKeys.map(filterKey => resource =>
        checks[filterKey](filterKey === 'id' ? resource.id : resource.attributes[filterKey])
      );

      return resources.filter(resource => filterFns.every(filterFn => filterFn(resource)));
    },
  };
}
