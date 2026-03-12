## Plan: Fix SSR localStorage crash

The error on / is caused by Zustand persist reading localStorage during server execution of a shared store module. The fix is to make store persistence SSR-safe at the storage layer, then verify all routes that import the store no longer trigger server localStorage reads.

**Steps**
1. Confirm failure source in /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/lib/store.ts and import path from /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/app/page.tsx via components that call useStore. Completed.
2. Update Zustand persist options in /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/lib/store.ts to use SSR-safe storage adapter (depends on step 1).
3. Keep component-level hydration guards only for UI mismatch prevention, not as SSR storage fix (parallel with step 2).
4. Validate / route and login route render without localStorage errors, and verify persisted state still hydrates in browser (depends on step 2).
5. Inspect environment for optional NODE_OPTIONS/localstorage-file warning cleanup if warning remains after store fix (depends on step 4).

**Relevant files**
- /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/lib/store.ts — persist middleware and token helper access points.
- /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/app/page.tsx — server entry route where failure manifests.
- /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/components/header.tsx — imports useStore on home path.
- /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/components/featured-products.tsx — imports useStore on home path.
- /Users/himanshu/Desktop/projects/js/nextjs/tryonstore/try-on-store-frontend/components/sidebar.tsx — imports useStore on home path.

**Verification**
1. Run dev server and load /. Confirm no TypeError localStorage.getItem is not a function in server logs.
2. Load /login and perform login flow. Confirm no regressions in auth/cart state.
3. Refresh page after state changes to verify persisted user/cart/theme rehydrate in browser.
4. If warning --localstorage-file remains, print shell NODE_OPTIONS and localstorage-related env vars to confirm external environment noise.

**Decisions**
- In scope: Root-cause analysis and implementation plan focused on SSR-safe store persistence.
- Out of scope: Refactoring unrelated components, API behavior, or backend auth implementation.
- Assumption: Home route imports store via client components, which is sufficient to trigger module-level persist initialization during server execution.