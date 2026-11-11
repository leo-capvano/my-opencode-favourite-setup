# my-opencode-favourite-setup

Plugins for [OpenCode](https://opencode.ai) V2.

| Plugin | What it does |
|---|---|
| [model-fallback](packages/model-fallback) | Switches to the next model in a per-model chain when a provider fails. This includes compaction. |
| [context-inspector](packages/context-inspector) | A `/context` panel showing what the latest model request was made of. |

## Install

Each plugin installs from its subdirectory:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "github:leo-capvano/my-opencode-favourite-setup#main::path:packages/context-inspector",
    {
      "package": "github:leo-capvano/my-opencode-favourite-setup#main::path:packages/model-fallback",
      "options": { "fallbacks": { "provider/model": ["other-provider/model"] } }
    }
  ]
}
```

Pin a tag or a commit hash instead of `main` for reproducible installs. See each plugin's README for options and limitations.

Tested with OpenCode 2.2.7.

## License

[MIT](LICENSE)
