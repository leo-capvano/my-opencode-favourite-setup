# opencode-context-inspector

A `/context` panel for the [OpenCode](https://opencode.ai) V2 terminal UI. It shows what the current session's latest model request was made of: instructions, skills, MCP / Code Mode, agents, built-in tools and messages. You can open any section to read its full text.

## Install

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:leo-capvano/my-opencode-favourite-setup#v0.1.0::path:packages/context-inspector"]
}
```

For a private repository, OpenCode uses your existing Git credentials. You can also clone the repository and point `plugins` at the local `packages/context-inspector` directory.

## Use

Run `/context` in a session after it has sent at least one request.

| Key | Action |
|---|---|
| `r` | Refresh |
| `f` | Toggle fullscreen |
| `esc` | Close |

Characters are exact. Token figures (`~t`) are estimates. They spread the last response's real token count across sections by character share.

## How it works

The plugin has three parts.

- **Server.** A `context` session hook records the composition of each session's latest request. The record is kept in memory only, for the 50 most recent sessions. It is never written to disk, and the request is never modified.
- **RPC.** The `context-inspector` contract has two methods. `get` returns section sizes. `section` returns one section's text.
- **TUI.** Draws the panel from the RPC data.

Other clients can call the same RPC over the OpenCode API:

```sh
opencode api post /api/rpc/context-inspector/get --data '{"input":{"sessionID":"ses_..."}}'
```

## Limitations

- Section categories are inferred from names. A custom tool is counted under MCP / Code Mode.
- Tested with OpenCode 2.2.7.

## License

MIT
