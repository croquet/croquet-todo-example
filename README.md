# Croquet Todo Example

Realtime collaborative todo app implemented using the Croquet platform.

## Getting Started

1. Install the packages.

```
yarn
```

2. Run the server.

```
yarn start
```

## Notes

```javascript
import * as Croquet from "@croquet/croquet";
```

Using prefixed names makes the code identical between importing Croquet
as module or via <script> tag and matches our other docs.

## Optimistic Updating

When updating the UI, you basically have two choices:

1. optimistically update the UI as soon as the user takes action, or
2. wait for a message from the server to update the UI.

Optimistic updates make the UI feel more responsive, as there is no latency between
the user's action and the UI updating. However, whenever the UI is being optimistically updated,
there is a possibility of inconsistent ordering and/or jumping across devices.

Consider the following scenario:
- User A adds a todo. Todos contains [1, 2, OptimisticTodoA]
- User B adds a todo. Todos contains [1, 2, OptimisticTodoB]
- User A receives B's message: Todos contain [1, 2, OptimisticTodoA, TodoB]
- User A receives A's message

At this point, there are two options:

1. Remove OptimisticTodoA from the list and insert at the end of the list, in
   which case Todos contain [1, 2, TodoB, TodoA].
   This would ensure that all devices see the same list of todos, but would cause
   the new todo to "jump" from third to fourth position. In reality, given the
   small size of this example, it would likely hardly be noticeable.
2. Remove OptimisticTodoA from the list and insert in place, in which case
   Todos contain [1, 2, TodoA, TodoB].
   This would prevent any kind of "jumping" of todos, but would mean that
   different devices see a different ordering of todos.

Interestingly, there's no right answer here. The best solution will be up to
the discretion of the developer.

