---
name: Radix Select mock pattern for jsdom tests
description: How to mock @/components/ui/select so that label-for associations work and onValueChange is testable via userEvent.selectOptions
type: feedback
---

Radix Select (`radix-ui` v1.4+) uses pointer events and portals that do not work in jsdom. Mock the entire `@/components/ui/select` module with a plain `<select>` element.

The tricky part: `BookingForm` passes `id` to `SelectTrigger`, not to `Select`. Use a React context inside the mock to propagate the id from `SelectTrigger` up to the wrapping `Select` so the rendered `<select>` receives the correct `id` and `getByLabelText` works.

Pattern used in `BookingForm.test.tsx`:

```ts
vi.mock('@/components/ui/select', async () => {
  const { createContext, useContext, useState } = await import('react')
  const IdContext = createContext<(id: string) => void>(() => {})

  const Select = ({ value, onValueChange, disabled, children }) => {
    const [triggerId, setTriggerId] = useState(undefined)
    return (
      <IdContext.Provider value={setTriggerId}>
        <select id={triggerId} value={value} onChange={(e) => onValueChange?.(e.target.value)} disabled={disabled}>
          {children}
        </select>
      </IdContext.Provider>
    )
  }

  const SelectTrigger = ({ children, id }) => {
    const register = useContext(IdContext)
    if (id) register(id)
    return null
  }

  const SelectValue = () => null
  const SelectContent = ({ children }) => <>{children}</>
  const SelectItem = ({ value, children }) => <option value={value}>{children}</option>

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})
```

**Why:** `getByLabelText('Date')` fails with "associated element is non-labellable" if the label's `for` points to a `<span>` rendered by SelectTrigger. The context trick ensures `<select id="date">` exists.

**How to apply:** Use this exact pattern whenever writing tests for any component that uses `@/components/ui/select`. The `async` factory + `await import('react')` is required because vi.mock factories cannot directly import module-level React in this project's vitest setup.
