import { DocumentData } from "firebase/firestore";

/**
 * A Firestore document merged with its own id — the shape produced by the
 * `{ id: doc.id, ...doc.data() }` pattern used throughout the services.
 *
 * TypeScript collapses that spread to just `{ id: string }`, because
 * `doc.data()` returns `DocumentData` (an index-signature type) and spreading
 * an index signature contributes no known properties. Annotating the result
 * with this type restores the field access without resorting to `any`:
 * `DocumentData` is Firestore's own type for "an untyped document body", so
 * it is the accurate description of what these reads actually return.
 *
 * Where a concrete shape is known it can be supplied:
 *   `const t: WithId<Task> = { id: doc.id, ...(doc.data() as Task) };`
 */
export type WithId<T = DocumentData> = T & { id: string };
