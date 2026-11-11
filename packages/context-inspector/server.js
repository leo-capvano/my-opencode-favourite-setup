// Keeps the composition of the latest model request per session in memory and
// serves it over RPC to the TUI `/context` command. Never writes to disk and
// never modifies the request.
import { ContextInspector } from "./rpc.js"

const MAX_SESSIONS = 50
// Shared across the plugin instances of every location, so a TUI asking from
// any location can see any session.
const latest = (globalThis.__contextInspectorLatest ??= new Map())

function text(value) {
  if (value == null) return ""
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, (_key, v) => (typeof v === "function" ? undefined : v), 2) ?? ""
  } catch {
    return ""
  }
}

const BUILTIN_TOOLS = new Set([
  "read", "glob", "grep", "edit", "write", "patch", "shell", "webfetch", "websearch",
  "question", "todowrite", "experimental_image_generate",
])

// category: instructions | skills | mcp | agents | tools | messages
// sub (messages only): user | assistant | reasoning | tool calls | tool output | loaded skills | other
function classify(group, name, body) {
  if (group === "system") {
    if (name === "core/skill-guidance") return { category: "skills" }
    if (name === "core/codemode") return { category: "mcp" }
    return { category: "instructions" }
  }
  if (group === "tools") {
    if (name === "skill") return { category: "skills" }
    if (name === "subagent") return { category: "agents" }
    if (name === "execute" || !BUILTIN_TOOLS.has(name)) return { category: "mcp" }
    return { category: "tools" }
  }
  const [, role, kind] = name.split(" ")
  if (body.includes("<skill_content")) return { category: "messages", sub: "loaded skills" }
  if (kind === "tool-result") return { category: "messages", sub: "tool output" }
  if (kind === "tool-call") return { category: "messages", sub: "tool calls" }
  if (kind === "reasoning") return { category: "messages", sub: "reasoning" }
  if (role === "user") return { category: "messages", sub: "user" }
  if (role === "assistant") return { category: "messages", sub: "assistant" }
  return { category: "messages", sub: "other" }
}

function snapshot(event) {
  const sections = []
  const add = (group, name, body) =>
    sections.push({ id: String(sections.length), group, name, body, ...classify(group, name, body) })

  for (const part of event.system ?? []) {
    const sources = part?.metadata?.experimental?.instructions
    if (Array.isArray(sources) && sources.length) {
      for (const source of sources) add("system", source.key, text(source.text))
    } else {
      const body = text(part?.text ?? part)
      add("system", body.replace(/\s+/g, " ").trim().slice(0, 48) || "(system part)", body)
    }
  }

  const tools = Array.isArray(event.tools)
    ? event.tools.map((t) => [t?.name ?? t?.id ?? "?", t])
    : Object.entries(event.tools ?? {})
  for (const [name, tool] of tools) add("tools", name, text(tool))

  ;(event.messages ?? []).forEach((message, index) => {
    const role = message?.role ?? message?.type ?? "message"
    const parts = Array.isArray(message?.content) ? message.content : [message?.content ?? message]
    parts.forEach((part) => {
      const kind = typeof part === "string" ? "text" : (part?.type ?? "part")
      const body = typeof part === "string" ? part : text(part?.text ?? part)
      add("messages", `#${index + 1} ${role} ${kind}`, body)
    })
  })

  const previous = latest.get(event.sessionID)
  return {
    sessionID: event.sessionID,
    agent: event.agent,
    model: event.model ? `${event.model.providerID}/${event.model.id}` : undefined,
    time: new Date().toISOString(),
    request: (previous?.request ?? 0) + 1,
    sections,
  }
}

export default {
  id: "context-inspector",
  async setup(ctx) {
    await ctx.session.hook("context", (event) => {
      try {
        if (!event.sessionID) return
        const snap = snapshot(event)
        latest.delete(event.sessionID)
        latest.set(event.sessionID, snap)
        while (latest.size > MAX_SESSIONS) latest.delete(latest.keys().next().value)
      } catch (err) {
        console.error("[context-inspector]", err)
      }
    })

    await ctx.rpc.register(ContextInspector, {
      get: async (input) => {
        const snap = latest.get(input.sessionID)
        if (!snap) return { found: false }
        const { sections, ...meta } = snap
        return {
          found: true,
          snapshot: {
            ...meta,
            sections: sections.map(({ body, ...s }) => ({ ...s, chars: body.length })),
          },
        }
      },
      section: async (input) => {
        const section = latest.get(input.sessionID)?.sections.find((s) => s.id === input.sectionID)
        return section ? { found: true, text: section.body } : { found: false }
      },
    })
  },
}
