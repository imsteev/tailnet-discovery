### General

- When a questionable decision is made, explain why using a `(AI)` prefix
- Always run prettier on JSX/TSX/CSS/HTML files
- 

### React

- File organization
  - Exported code at top of file
  - New component:
  ```tsx
  interface Props {}

  export default function ComponentName(props?: Props) {
    // ...
  }
  ```
  - One exported component per file
  - Hoist out functions that do not depend on any component state/props
- State management
  - Less state is preferred. Derive values whenever possible
  - Be thoughtful about undefined / null values (e.g, null could represent a certain fact)
  - Consider using a reducer or object if there's more than 5 separate but related pieces of state
- Styling
  - General guidance: https://anthonyhobday.com/sideprojects/saferules/
  - Prefer using Tailwind
  - If a design system exists in the codebase, use it as much as possible. Typically these are building block components like Button, Select, Dialog, etc.
- Components
  - Factor out components if there's more than 5 separate and unrelated pieces of state
  - If needed, use a folder to encapsulate related components for better organization
  - Components that mutate data should have some way to refresh data after performing the operation. This can typically be done by accepting a refresh callback
