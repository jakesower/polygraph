export const operations = {
  $and: predicates => val => predicates.every(predicate => predicate(val)),
  $eq: val1 => val2 => val1 === val2,
  $in: vals => val => vals.includes(val),
  $or: predicates => val => predicates.some(predicate => compile(predicate)(val)),
};

export function compile(expression) {
  const k = Object.keys(expression)[0];
  const operation = operations[k];

  return operation(expression[k]);
}
