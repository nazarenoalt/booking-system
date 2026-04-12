---
name: next/navigation mock pattern with router.refresh
description: How to mock both router.push and router.refresh from next/navigation in BookingList-style tests
type: feedback
---

Mock `next/navigation` by returning an object with all needed router methods from `useRouter`. When a component calls both `router.push` and `router.refresh`, expose both as `vi.fn()` at the module level so each can be asserted independently.

```ts
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))
```

**Why:** BookingList calls `router.refresh()` (not `router.push`) after a successful DELETE to revalidate the server component above it. Missing `refresh` in the mock causes a runtime error or silent no-op.

**How to apply:** Any time a component under test calls `router.refresh()`, include it in the `useRouter` mock return. Use `vi.resetAllMocks()` in `beforeEach` to keep call counts clean across tests.
