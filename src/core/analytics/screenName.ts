/**
 * Turning a resolved route into a screen NAME that carries no customer record.
 *
 * Kept apart from `screenTracking.ts` deliberately: that module imports the native Firebase
 * package, which cannot load under Jest, and this is the half worth testing. A sanitiser nobody
 * can run tests against is a sanitiser nobody checks.
 */

/**
 * `/booking/9f3c-...` -> `/booking/:id`.
 *
 * Anything that looks like an identifier is replaced: a UUID, or any long run of digits or
 * hex. Deliberately eager -- over-collapsing two screens into one label costs a little precision,
 * while under-collapsing puts a real booking id in an analytics event.
 */
export function screenNameFrom(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => {
      if (segment === '') return segment;
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return ':id';
      }
      if (/^[0-9]{4,}$/.test(segment)) return ':id';
      if (/^[0-9a-f]{12,}$/i.test(segment)) return ':id';
      return segment;
    })
    .join('/');
}
