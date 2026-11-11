// Per-model fallback chains for OpenCode V2.
//
// Configure in opencode.json:
//
//   "plugins": [{
//     "package": "github:leo-capvano/my-opencode-favourite-setup#main::path:packages/model-fallback",
//     "options": {
//       "fallbacks": {
//         "proxy-provider/claude-haiku": [
//           "direct-provider/claude-haiku",
//           "other-provider/some-model"
//         ]
//       }
//     }
//   }]
//
// When a request on a configured model fails for any provider reason (proxy
// down, 429, auth, 5xx, budget, ...), the session switches to the next model of
// that model's chain and retries immediately. A failing fallback moves on to the
// next entry of the same chain. Models without a chain, and exhausted chains,
// keep OpenCode's default handling: the request fails.
// The switch persists for the session; use /models to go back.

// Failures where another model will not help.
const SKIP = /abort|interrupt|cancel|content[-_ ]?filter|context[-_ ]?(overflow|length)/i

const key = (m) => `${m.providerID}/${m.id}`

function parse(ref) {
  const [path, variant] = String(ref).split("#")
  const slash = path.indexOf("/")
  if (slash <= 0) return undefined
  return { providerID: path.slice(0, slash), id: path.slice(slash + 1), ...(variant ? { variant } : {}) }
}

export default {
  id: "model-fallback",
  async setup(ctx) {
    const chains = new Map()
    for (const [primary, list] of Object.entries(ctx.options?.fallbacks ?? {})) {
      const models = (Array.isArray(list) ? list : [list]).map(parse).filter(Boolean)
      if (models.length) chains.set(primary.split("#")[0], models)
    }
    if (!chains.size) return

    // sessionID -> { primary, chain, index } where chain[index] is the active fallback.
    const active = new Map()

    // Compaction runs on its own configured model, not the session model, so the
    // retry switch does not reach it. Generate the summary here instead, walking
    // the same chain. Models without a chain keep OpenCode's built-in compaction.
    const MAX_TRANSCRIPT = 600_000
    // Helper sessions walk the chain themselves; the retry hook must not switch them too.
    const helpers = new Set()
    await ctx.session.hook("compaction", async (event) => {
      const primary = key(event.model)
      const chain = chains.get(primary)
      if (!chain) return

      const transcript = JSON.stringify(event.messages, (_k, v) =>
        typeof v === "string" && v.length > 4000 ? `${v.slice(0, 4000)}…` : v,
      ).slice(-MAX_TRANSCRIPT)
      const prompt =
        "Summarize the conversation below so work can continue after the history is cleared. " +
        "Keep the user's goals and constraints, decisions made, files changed, commands and results that matter, " +
        "errors, open questions and next steps. Be concise and factual.\n\n" +
        `Conversation (JSON):\n${transcript}`

      // Generate inside a throwaway session so other plugins' session hooks
      // (request rewrites, telemetry, ...) apply, unlike stateless generation.
      const helper = await ctx.session.create({ title: `compaction fallback for ${event.sessionID}` })
      const helperID = helper?.id ?? helper?.data?.id
      helpers.add(helperID)
      let lastError
      try {
        await ctx.session.switchAgent({ sessionID: helperID, agent: event.agent ?? "compaction" }).catch(() => {})
        for (const model of [{ providerID: event.model.providerID, id: event.model.id }, ...chain]) {
          try {
            await ctx.session.switchModel({ sessionID: helperID, model })
            const out = await ctx.session.generate({ sessionID: helperID, prompt })
            const text = typeof out === "string" ? out : (out?.text ?? out?.data?.text)
            if (!text) throw new Error("empty summary")
            if (key(model) !== primary) console.error(`[model-fallback] compaction ${primary} failed -> ${key(model)}`)
            event.result = { summary: text, metadata: { model: key(model) } }
            return
          } catch (err) {
            lastError = err
            console.error(`[model-fallback] compaction on ${key(model)} failed: ${String(err?.message ?? err).slice(0, 160)}`)
          }
        }
      } finally {
        helpers.delete(helperID)
        await ctx.session.remove({ sessionID: helperID }).catch(() => {})
      }
      throw lastError
    })

    await ctx.session.hook("retry", async (event) => {
      const { sessionID, model, error } = event
      if (helpers.has(sessionID)) {
        event.decision = { retry: false }
        return
      }
      if (SKIP.test(`${error.type} ${error.message}`)) return

      let state = active.get(sessionID)
      if (!state || key(state.chain[state.index]) !== key(model)) {
        const chain = chains.get(key(model))
        if (!chain) return
        state = { primary: key(model), chain, index: -1 }
      }

      while (++state.index < state.chain.length) {
        const next = state.chain[state.index]
        try {
          await ctx.session.switchModel({ sessionID, model: next })
        } catch (err) {
          console.error(`[model-fallback] ${sessionID}: cannot switch to ${key(next)}: ${err?.message ?? err}`)
          continue
        }
        active.set(sessionID, state)
        console.error(
          `[model-fallback] ${sessionID}: ${key(model)} failed (${error.status ?? error.type}: ${String(error.message).slice(0, 160)}) -> ${key(next)} [${state.index + 1}/${state.chain.length} for ${state.primary}]`,
        )
        event.decision = { retry: true, delay: 0 }
        return
      }
      active.delete(sessionID)
      console.error(`[model-fallback] ${sessionID}: fallbacks for ${state.primary} exhausted`)
    })
  },
}
