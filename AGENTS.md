# AGENTS

## IMPORTANT: The V1 request logic is LEGACY code. Do not modify it.

`src/components/Bulk.vue` contains two request flows, switched by the
`use_v2_process_function` setting ("Use Process Function Version 2"):

| Path | Where it lives | Status |
| --- | --- | --- |
| V1 | `axiosRequest()`, plus the `else` branch in `bulkProcess()` that calls it | **LEGACY - frozen** |
| V2 | `axiosRequestV2()` / `axiosRequestRetryV2()` / `requestItemsV2()` / the manual retry UI | Maintained path |

### Rules

1. **Never change the V1 logic.** Do not refactor it, optimize it, reformat it, or
   "fix bugs on the side". Its current behavior (simple error handling, no retry,
   fixed 1s sleep, etc.) is intentional and must stay equivalent.
2. **All new features and bug fixes go into the V2 path only.** When a request asks for
   "fix the request flow" or similar, assume V2 by default. Touch V1 only when the user
   explicitly asks for it.
3. **V2-only features must be explicitly disabled on V1.** For example, the manual
   `Retry Failed` button is disabled when `use_v2_process_function === false`, and
   `retryButtonClicked()` returns early with a hint message.
4. **Shared code must stay behavior-compatible for V1.** When touching shared helpers
   (e.g. `buildElementOutput()`, `outputToBox()`), the output produced for the V1 path
   must remain exactly the same as before the change.

The same notice is duplicated as a comment block directly above `axiosRequest()` in
`src/components/Bulk.vue`. Keep that comment in place.

## Language requirement

- **All code comments must be written in English.**
- **All documentation files (README, AGENTS.md, notes, etc.) must be written in English.**
- Other languages is fine for chatting with users / commit discussion, but not for anything
  committed into the repository.
