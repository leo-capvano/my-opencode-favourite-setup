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
    "github:leo-capvano/my-opencode-favourite-setup#v0.1.1::path:packages/context-inspector",
    {
      "package": "github:leo-capvano/my-opencode-favourite-setup#v0.1.1::path:packages/model-fallback",
      "options": { "fallbacks": { "provider/model": ["other-provider/model"] } }
    }
  ]
}
```

Versions are git tags (see [Releases](https://github.com/leo-capvano/my-opencode-favourite-setup/tags)). To upgrade, change `v0.1.1` to the newer tag. `#main` also works and follows the latest commit. See each plugin's README for options and limitations.

Tested with OpenCode 2.2.7.

## Development

TUI parts are written in `.tsx` and shipped precompiled. OpenTUI compiles Solid JSX at runtime only for files outside `node_modules`, and installed plugins live inside it. After editing `packages/context-inspector/tui.tsx`, rebuild and commit the generated `tui.js`:

```sh
npm install
npm run build
```

## License

[MIT](LICENSE)
