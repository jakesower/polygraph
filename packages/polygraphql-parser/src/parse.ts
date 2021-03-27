export function parse(queryStr) {
  const chars = queryStr.split('');
  const l = chars.length;
  let idx = 0;

  const surrounding = (n = 6) => {
    let out = '';
    for (let i = Math.max(idx - n, 0); i < Math.min(idx + n, l); i += 1) {
      out += chars[i];
    }
    return out;
  };

  /* Pattern:

  1. Letters denoting resource
  2. (Optional) An opening parenthesis
    a. A string /[A-Za-z_$]+/
    b. A colon
    c. Either a string /[A-Za-z0-9_]+/ or a quoted string with anything, escaped with \
    d. (Optional) A comma, at which point, return to (2a)
    e. A closing parenthesis
  3. An opening curly brace
  4. (Optional) An asterisk, skip to (6)
  5.
    a. A string /[A-Za-z_]+/
    b. (Optional) An opening curly brace (go to 2, then return with closing curly brace, using str as value of 1)
    c. Whitespace
    d. (Optional) A closing curly brace, go to (6)
    e. Go to (5a)
  6. A closing curly brace

  // Output:

  {
    type: ...,
    options: ...,
    attributes: ...,
    relationships: ...,
  }

  This is not validated against a schmea, merely broken into bits.

  */
  function trimWhitespace() {
    while (/\s/.test(chars[idx]) && idx < l) {
      idx++;
    }
  }

  function extractPossiblyQuotedString() {
    let out = '';
    const startingIdx = idx;

    // TODO: support nested objects and arrays in options
    if (!/[A-Za-z0-9_$"]/.test(chars[idx])) {
      throw new SyntaxError(
        `Option keys and values may only contain letters, numbers, '_', '$', or be double quoted at index ${startingIdx}`
      );
    }

    if (chars[idx] === '"') {
      let escaping = false;

      idx++;

      while (chars[idx] !== '"' || escaping) {
        if (idx >= l) {
          throw new SyntaxError(`Unterminated quoted string starting at index ${startingIdx}`);
        }

        if (chars[idx] === '\\' && !escaping) {
          escaping = true;
        } else {
          out = out + chars[idx];
          escaping = false;
        }

        idx++;
      }

      idx++;
      return out;
    }

    while (/[A-Za-z0-9_$]/.test(chars[idx])) {
      out = out + chars[idx];
      idx++;
    }

    return out;
  }

  function getResourceName() {
    let name = '';
    while (/[A-Za-z_]/.test(chars[idx]) && idx < l) {
      name = name + chars[idx];
      idx++;
    }

    return name;
  }

  function getOptions() {
    let output = {};

    trimWhitespace();
    if (chars[idx] !== '(') {
      return {};
    }

    idx++;
    while (true) {
      trimWhitespace();

      const key = extractPossiblyQuotedString();

      trimWhitespace();

      if (chars[idx] !== ':') {
        throw new SyntaxError(`Expect a string between option keys and values at index ${idx}`);
      }

      idx++;
      trimWhitespace();

      output[key] = extractPossiblyQuotedString();

      trimWhitespace();

      if (chars[idx] !== ')' && chars[idx] !== ',') {
        throw new SyntaxError(`Expected close parenthesis or comma at index ${idx}`);
      }

      if (chars[idx] === ',') {
        idx++;
        trimWhitespace();
      }

      if (chars[idx] === ')') {
        idx++;
        return output;
      }
    }
  }

  function getValues() {
    let attributes = [];
    let relationships = {};
    let atLeastOne = false;

    trimWhitespace();

    while (chars[idx] !== '}' && idx < l) {
      let value = '';
      atLeastOne = true;

      while (/[A-Za-z_$]/.test(chars[idx])) {
        value = value + chars[idx];
        idx++;
      }

      trimWhitespace();

      if (chars[idx] === '{' || chars[idx] === '(') {
        relationships[value] = extractResource(value);
      } else {
        attributes[attributes.length] = value;
      }

      trimWhitespace();
    }

    if (!atLeastOne) {
      throw new SyntaxError(
        `Expected at least one attribute or relationship within block at index ${idx}`
      );
    }

    return { attributes, relationships };
  }

  function extractResource(resourceName) {
    while (idx < l) {
      const options = getOptions();

      trimWhitespace();

      if (chars[idx] !== '{') {
        throw new SyntaxError(
          `Expected opening parenthesis or opening curly brace at index ${idx}`
        );
      }

      idx++;

      trimWhitespace();

      const { attributes, relationships } = getValues();

      trimWhitespace();

      if (idx >= l) {
        throw new SyntaxError("Expected '}' before the end of the query string");
      }

      if (chars[idx] !== '}') {
        throw new SyntaxError(`Expected closing curly brace at index ${idx}`);
      }

      return {
        type: resourceName,
        options,
        attributes,
        relationships,
      };
    }

    throw new SyntaxError('Expected resource block in query string');
  }

  trimWhitespace();
  const resourceName = getResourceName();

  return extractResource(resourceName);
}
