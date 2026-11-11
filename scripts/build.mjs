// Precompiles TUI parts with Solid's universal transform, the same one OpenTUI
// applies at runtime. OpenTUI skips that transform for files under
// node_modules, which is where installed plugins live, so published TUI parts
// must ship compiled JavaScript.
import { transformAsync } from "@babel/core"
import ts from "@babel/preset-typescript"
import solid from "babel-preset-solid"
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const entries = [["packages/context-inspector/tui.tsx", "packages/context-inspector/tui.js"]]
const root = fileURLToPath(new URL("..", import.meta.url))

for (const [source, target] of entries) {
  const filename = root + source
  const result = await transformAsync(await readFile(filename, "utf8"), {
    filename,
    configFile: false,
    babelrc: false,
    presets: [[solid, { moduleName: "@opentui/solid", generate: "universal" }], [ts]],
  })
  await writeFile(
    root + target,
    `// Generated from ${source.split("/").pop()} by scripts/build.mjs. Do not edit.\n${result.code}\n`,
  )
  console.log(`built ${target}`)
}
