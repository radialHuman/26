# tRPC
End-to-end TypeScript type safety for APIs.
✓ Full type safety, no code gen ✗ TypeScript only
Great for: Full-stack TypeScript apps (Next.js)
```ts
const trpc = initTRPC.create();
export const appRouter = trpc.router({
  hello: trpc.procedure.query(() => 'world')
});
```
Docs: https://trpc.io/
