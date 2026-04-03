const isDev = process.env.NODE_ENV === 'development';

function noop() {}

export const logger = {
  debug: isDev ? console.debug.bind(console, '[NoTrace]') : noop,
  info: isDev ? console.info.bind(console, '[NoTrace]') : noop,
  warn: console.warn.bind(console, '[NoTrace]'),
  error: console.error.bind(console, '[NoTrace]'),
};
