### General

- When a questionable decision is made, add code comments identified with `(AI)` explaining what the decision was, why it was made, and what future considerations to take into account
- Always run prettier on JSX/TSX/CSS/HTML files

### React

- File organization
  - One component definition per file. Be consistent with export patterns (e.g, if most components are declared with `export default function ComponentName({ ... })`, do that)
  - Hoist out functions that do not depend on any component state/props
- Side effects
  - Minimize the number of `useEffect` ’s are in the codebase. This should improve reader’s ability to understand application behavior and when things happen
- State management
  - Less state is better. Prefer derived values whenever possible
  - Be thoughtful about undefined / null values. Treat them intentionally (e.g, null could represent a certain fact)
  - If there's more than 4-5 related pieces of state, consider using a reducer or compact into an object, whichever fits the design more appropriately
- Styling
  - General guidance: https://anthonyhobday.com/sideprojects/saferules/
  - If there is a design system of building block components, use those instead of native html elements (e.g, `<Button ... />` vs `<button>`).
    - If a design system component doesnt meet requirements, try to customize as necessary, or fallback to native html element.
