/**
 * Error monitoring, optional and per instance.
 *
 * Sentry is loaded only when the instance sets VITE_SENTRY_DSN, and it is loaded
 * dynamically: an instance without monitoring never downloads the SDK, and the
 * public demo sends nothing anywhere. The Sentry release is the platform version,
 * so an error is attributed to the build that produced it.
 *
 * Nothing here sends personal data: association portals carry member names and
 * emails, so PII is off and the payload is scrubbed before it leaves the browser.
 */

type SentryModule = typeof import('@sentry/react');

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE;
/** 0 by default: traces are billed and an association portal rarely needs them. */
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0');

let sentry: SentryModule | null = null;
let loading: Promise<SentryModule | null> | null = null;

/** Query strings can carry a member email from a shared link; the path is enough. */
function stripQuery(url: string | undefined): string | undefined {
  if (!url) return url;
  const cut = url.indexOf('?');
  return cut === -1 ? url : url.slice(0, cut);
}

function load(): Promise<SentryModule | null> {
  if (!dsn) return Promise.resolve(null);
  if (loading) return loading;

  loading = import('@sentry/react')
    .then((module) => {
      module.init({
        dsn,
        environment,
        release: `community-platform@${__PLATFORM_VERSION__}`,
        tracesSampleRate,
        sendDefaultPii: false,
        beforeSend(event) {
          if (event.request) {
            event.request.url = stripQuery(event.request.url);
            delete event.request.cookies;
            delete event.request.headers;
          }
          delete event.user;
          return event;
        },
      });
      sentry = module;
      return module;
    })
    .catch((error) => {
      // Monitoring must never be the reason a portal fails to start
      console.warn('Monitoring disabled: Sentry failed to load.', error);
      return null;
    });

  return loading;
}

/** Called once at start-up; a no-op when the instance configured no DSN. */
export function initMonitoring(): void {
  void load();
}

/** True when this build is reporting somewhere, for the admin to show. */
export const isMonitoringEnabled = Boolean(dsn);

/**
 * Reports an error with context. Falls back to the console so a developer sees
 * the same information an instance with monitoring would have captured.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) {
    console.error('[monitoring]', error, context ?? '');
    return;
  }
  void load().then((module) => {
    if (!module) return;
    module.captureException(error, context ? { extra: context } : undefined);
  });
}

/** Exposed for tests; the loaded module is otherwise private to this file. */
export function loadedSentry(): SentryModule | null {
  return sentry;
}
