# OpenCode Rules

## Performance

- Read only the minimum number of files required.
- Never reread an unchanged file.
- Never search the entire repository if the file path is already known.
- Avoid duplicate Glob and Grep operations.
- Do not read more than 300 lines unless necessary.
- Stop searching after one "File not found" error and report it.
- Prefer editing existing files over rescanning the repository.

## Coding

- Make the smallest possible change.
- Preserve existing architecture.
- Do not rewrite unrelated code.

## Context

- Keep context as small as possible.
- Remove obsolete assumptions before continuing.