# Preload and Cache Policy

Japan Life defaults every new user-facing feature into preload and cache coverage.

When adding a new page, data source, or feature module:

1. Add the route to `routePreloadHrefs` in `src/lib/appPreload.ts` unless it is a private dynamic detail route that cannot be known ahead of time.
2. Add a typed `getCached...` and `warm...` function in `src/lib/appPreload.ts` for any page data that is fetched after render.
3. Call the `getCached...` function in the page or hook before requesting fresh data, so cached content renders immediately.
4. Call the `warm...` function after reading cache, so fresh data updates in the background.
5. Add the `warm...` function to `warmCoreAppData()` when the data is useful for common navigation, app startup, or cross-page reuse.
6. Clear the matching preload cache after create, update, delete, approve, reject, publish, unpublish, or any admin/content mutation that changes the user-visible result.
7. Use short TTLs for fast-changing data such as weather, train status, notifications, and exchange rates. Use the normal TTL for slower content.
8. Do not preload protected admin APIs or mutation APIs. Route prefetch is fine; authenticated data requests should happen only after the page has the required auth context.

If a new feature cannot use preload/cache, document the reason in the PR or change note. The default is: cached first, warm refresh second.
