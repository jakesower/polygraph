import { mapObj } from '@polygraph/utils';
import { compile } from './operations';

export function filter(resources, filterExps = {}) {
  const filterKeys = Object.keys(filterExps);
  const checks = mapObj(filterExps, expression => compile(expression));
  const filterFns = filterKeys.map(filterKey => resource =>
    checks[filterKey](filterKey === 'id' ? resource.id : resource.attributes[filterKey])
  );

  return resources.filter(resource => filterFns.every(filterFn => filterFn(resource)));
}
