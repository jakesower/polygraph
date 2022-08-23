export class BlossomError extends Error {
  constructor(message, details) {
    super(message);
    Object.keys(details).forEach((key) => {
      this[key] = details[key];
    });
  }
}