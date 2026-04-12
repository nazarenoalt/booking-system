---
name: BookingService is not a named export — only the singleton is
description: BookingService class is unexported; tests must use the bookingService singleton and reset via bookingRepository.clear()
type: feedback
---

`BookingService` is a private class in `src/core/services/BookingService.ts` — only `export const bookingService = new BookingService(bookingRepository)` is exported. Tests cannot instantiate a fresh service; instead they must use the shared singleton and reset state by calling `bookingRepository.clear()` in `beforeEach`. This works because both the singleton and `bookingRepository` share the same module-level `Map`.

**Why:** Attempting `new BookingService(...)` in tests would fail with a TypeScript error since the class is not exported.

**How to apply:** In any service-layer test, import `bookingService` (singleton) and `bookingRepository` (for `.clear()`). Never try to import or instantiate `BookingService` directly.
