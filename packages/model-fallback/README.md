# opencode-model-fallback

Per-model fallback chains for [OpenCode](https://opencode.ai) V2. When a request fails on a model that has a chain, the session switches to the next model in that chain and retries right away. Compaction is covered too.

OpenCode has no built-in fallback: `model` takes a single model. This plugin adds one through the session `retry` and `compaction` hooks.

## Install

Add the plugin to `plugins` in your `opencode.json(c)` together with its options:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "github:leo-capvano/my-opencode-favourite-setup#main::path:packages/model-fallback",
      "options": {
        "fallbacks": {
          "proxy-provider/claude-haiku": ["direct-provider/claude-haiku"],
          "proxy-provider/claude-sonnet": ["direct-provider/claude-sonnet", "other-provider/some-model"]
        }
      }
    }
  ]
}
```

For a private repository, OpenCode uses your existing Git credentials. You can also clone the repository and point `package` at the local `packages/model-fallback` directory.

## Options

| Option | Type | Description |
|---|---|---|
| `fallbacks` | `{ [model]: model[] }` | Maps a model (`provider/model`) to the models to try next, in order. A single string is also accepted. A `#variant` suffix on a fallback selects that variant. |

Without any `fallbacks`, the plugin does nothing.

## Behaviour

**Main sessions and subagents**

- On any failure except abort, interrupt, cancel, content filter and context overflow, the session switches to the next model of the failing model's chain and retries with no delay. This covers connection refused, 429, auth errors, 5xx and budget errors.
- Chains are looked up by the model that failed. When a fallback fails too, the plugin moves to the next entry of the same chain. When the chain runs out, the request fails as it normally would.
- The switch is **sticky** for the session. It shows up as a "model switched" entry. Use `/models` to go back to the original model.
- Subagents with a pinned model switch the same way. Each new subagent starts on its pinned model, so it fails once before it switches.
- Models without a chain keep OpenCode's default handling.

**Compaction**

Compaction runs on its own configured model (`agents.compaction.model`), so the retry switch does not reach it. When that model has a chain, the plugin writes the summary itself:

1. It creates a temporary helper session, so other plugins' request hooks still apply.
2. It tries the compaction model, then each fallback in order.
3. It deletes the helper session.

The model that wrote the summary is recorded in the compaction's `metadata.model`. When the compaction model has no chain, OpenCode's built-in compaction runs unchanged.

## Limitations

- **Different summary prompt.** OpenCode's built-in compaction prompt isn't exposed to plugins. Compaction on a model with a chain therefore always uses this plugin's prompt, even when the primary model is healthy.
- **Transcript cap.** The compaction transcript is limited to the last 600,000 characters, and individual strings are cut to 4,000 characters.
- **Slow compaction fallback.** When the primary compaction route is down, compaction can take 1–2 minutes before a fallback writes the summary.
- **No automatic switch back.** A session that switched stays on the fallback after the primary recovers.
- **Undocumented behaviour.** The plugin relies on the V2 `retry` and `compaction` session hooks and on `session.generate`. Tested with OpenCode 2.2.7. These may change between releases.

## License

MIT
