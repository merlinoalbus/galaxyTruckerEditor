// Lightweight logger utility to avoid direct console.log usage and gate noisy logs
// Usage: import { logger } from '@/utils/logger'; logger.debug('msg', data)

type LogMethod = (message?: any, ...optionalParams: any[]) => void;

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function isDebugEnabled(): boolean {
  if (isProd || isTest) return false;
  try {
    // Enable via window.__DEBUG__ or localStorage.DEBUG = 'true'
    const w = (globalThis as any).window as any;
    if (w && w.__DEBUG__ === true) return true;
    const ls = (globalThis as any).localStorage as Storage | undefined;
    if (ls && ls.getItem('DEBUG') === 'true') return true;
  } catch {}
  return false;
}

const prefix = '[GT-Editor]';

const debug: LogMethod = (...args) => {
  if (!isDebugEnabled()) return;
  // Use console.debug to keep chrome filters intact
  // eslint-disable-next-line no-console
  console.debug(prefix, ...args);
};

const info: LogMethod = (...args) => {
  if (isProd || isTest) return; // keep info out of prod/test by default
  // eslint-disable-next-line no-console
  console.info(prefix, ...args);
};

const warn: LogMethod = (...args) => {
  // eslint-disable-next-line no-console
  console.warn(prefix, ...args);
};

const error: LogMethod = (...args) => {
  // eslint-disable-next-line no-console
  console.error(prefix, ...args);
};

export const logger = { debug, info, warn, error };
