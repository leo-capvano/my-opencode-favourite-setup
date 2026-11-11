/** @jsxImportSource @opentui/solid */
// `/context` panel: visual breakdown of what the current session sent to the
// model on its latest request. Data comes from the server part over RPC and
// lives only in memory.
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import { ContextInspector } from "./rpc.js"

const PANEL = "context-inspector"

const PALETTE = {
  text: "#c0caf5",
  muted: "#7982a9",
  dim: "#565f89",
  track: "#292e42",
  border: "#3b4261",
  accent: "#7aa2f7",
  dark: "#1a1b26",
  ok: "#9ece6a",
  warn: "#e0af68",
  bad: "#f7768e",
}

const CATEGORIES = [
  { id: "instructions", label: "Instructions", color: "#7aa2f7" },
  { id: "skills", label: "Skills", color: "#bb9af7" },
  { id: "mcp", label: "MCP / Code Mode", color: "#e0af68" },
  { id: "agents", label: "Agents", color: "#9ece6a" },
  { id: "tools", label: "Built-in tools", color: "#7dcfff" },
  { id: "messages", label: "Messages", color: "#f7768e" },
]
const MESSAGE_SUBS = [
  { id: "tool output", color: "#f7768e" },
  { id: "tool calls", color: "#ff9e64" },
  { id: "assistant", color: "#e0af68" },
  { id: "reasoning", color: "#c0a36e" },
  { id: "user", color: "#73daca" },
  { id: "loaded skills", color: "#bb9af7" },
  { id: "other", color: "#7982a9" },
]

const fmt = (n) => Math.round(n).toLocaleString("en-US")
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n)))
const pct = (part, whole) => (whole ? `${((100 * part) / whole).toFixed(1)}%` : "0.0%")
const pad = (s, w) => String(s).slice(0, w).padEnd(w)
const lpad = (s, w) => String(s).padStart(w)
const filled = (part, whole, width) => {
  if (!whole || part <= 0) return 0
  return Math.max(1, Math.min(width, Math.round((part / whole) * width)))
}

function Gauge(props) {
  const n = () => filled(props.part, props.whole, props.width)
  return (
    <>
      <span fg={props.color}>{"█".repeat(n())}</span>
      <span fg={PALETTE.track}>{"░".repeat(Math.max(0, props.width - n()))}</span>
    </>
  )
}

function Card(props) {
  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={PALETTE.border}
      title={` ${props.title} `}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      marginTop={1}
      flexGrow={props.grow ? 1 : 0}
      width={props.width}
    >
      {props.children}
    </box>
  )
}

function Key(props) {
  return (
    <>
      <span bg={PALETTE.border} fg={PALETTE.text}>{` ${props.k} `}</span>
      <span fg={PALETTE.muted}>{` ${props.label}   `}</span>
    </>
  )
}

export default {
  id: "context-inspector.tui",
  setup(context) {
    async function tokenUsage(sessionID) {
      try {
        await context.data.session.message.sync(sessionID)
        const messages = context.data.session.message.list(sessionID) ?? []
        const last = messages
          .filter((m) => m?.type === "assistant" && m.tokens)
          .sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))[0]
        if (!last) return undefined
        const t = last.tokens
        const used = (t.input ?? 0) + (t.cache?.read ?? 0) + (t.cache?.write ?? 0)
        let limit
        try {
          const location = context.location ?? context.data.location.default()
          await context.data.location.model.sync(location)
          const models = context.data.location.model.list(location) ?? []
          const model = models.find((m) => m?.id === last.model?.id && m?.providerID === last.model?.providerID)
          limit = model?.limit?.context
        } catch {}
        return { used, limit }
      } catch {
        return undefined
      }
    }

    function ContextPanel(props) {
      const [snap, setSnap] = createSignal()
      const [usage, setUsage] = createSignal()
      const [status, setStatus] = createSignal("Loading…")

      const load = async () => {
        const sessionID = props.panel.sessionID
        if (!sessionID) return setStatus("Open a session first.")
        try {
          const result = await context.client.rpc(ContextInspector).get({ sessionID })
          if (!result?.found) {
            setSnap(undefined)
            setStatus("No model request recorded for this session yet. Send a prompt, then press r.")
            return
          }
          setSnap(result.snapshot)
          setStatus("")
          setUsage(await tokenUsage(sessionID))
        } catch (err) {
          setStatus(`Error: ${String(err?.message ?? err)}`)
        }
      }
      load()

      const stop = context.data.on("session.execution.succeeded", () => load())
      onCleanup(() => stop?.())

      context.keymap.layer(() => ({
        commands: [
          { id: "context-inspector.refresh", title: "Refresh context", bind: "r", run: () => load() },
          { id: "context-inspector.fullscreen", title: "Toggle fullscreen", bind: "f", run: () => props.panel.toggleFullscreen() },
          { id: "context-inspector.close", title: "Close context", bind: "escape", run: () => props.panel.close() },
        ],
      }))

      // Layout: outer padding 2 + card border 2 + card padding 4.
      const panelWidth = () => Math.max(60, props.panel.width ?? 100)
      const inner = () => panelWidth() - 8
      const wide = () => panelWidth() >= 140
      const halfInner = () => Math.floor((panelWidth() - 4) / 2) - 7
      // Row: marker 2 + label 18 + gap 2 + gauge + chars 9 + tokens 11 + pct 8.
      const gaugeWidth = (space) => Math.max(10, space - 50)

      const sections = () => snap()?.sections ?? []
      const total = createMemo(() => sections().reduce((a, s) => a + s.chars, 0))
      const byCategory = createMemo(() =>
        CATEGORIES.map((c) => ({ ...c, chars: sections().filter((s) => s.category === c.id).reduce((a, s) => a + s.chars, 0) })),
      )
      const messagesTotal = createMemo(() => byCategory().find((c) => c.id === "messages")?.chars ?? 0)
      const bySub = createMemo(() =>
        MESSAGE_SUBS.map((m) => ({ ...m, chars: sections().filter((s) => s.sub === m.id).reduce((a, s) => a + s.chars, 0) })).filter(
          (r) => r.chars > 0,
        ),
      )
      const top = createMemo(() =>
        [...sections()].filter((s) => s.group !== "messages").sort((a, b) => b.chars - a.chars).slice(0, 10),
      )
      const tokensOf = (chars) => (usage()?.used && total() ? (usage().used * chars) / total() : undefined)
      const colorOf = (id) => CATEGORIES.find((c) => c.id === id)?.color ?? PALETTE.text
      const windowShare = () => (usage()?.limit ? usage().used / usage().limit : 0)
      const windowColor = () => (windowShare() > 0.8 ? PALETTE.bad : windowShare() > 0.5 ? PALETTE.warn : PALETTE.ok)

      const stacked = () => {
        const width = inner()
        let used = 0
        return byCategory()
          .filter((c) => c.chars > 0)
          .map((c, i, list) => {
            const n = i === list.length - 1 ? width - used : filled(c.chars, total(), width)
            used += n
            return { color: c.color, n: Math.max(0, n) }
          })
      }

      const Row = (p) => (
        <text>
          <span fg={p.color}>{"● "}</span>
          <span fg={PALETTE.text}>{pad(p.label, 18)}</span>
          <span>{"  "}</span>
          <Gauge part={p.chars} whole={p.whole} width={p.width} color={p.color} />
          <span fg={PALETTE.text}>{lpad(short(p.chars), 9)}</span>
          <span fg={PALETTE.dim}>{lpad(tokensOf(p.chars) ? `~${short(tokensOf(p.chars))}t` : "", 11)}</span>
          <span fg={p.color}>{lpad(pct(p.chars, p.whole), 8)}</span>
        </text>
      )

      const MessagesCard = (p) => (
        <Card title="Messages" grow={p.grow}>
          <For each={bySub()}>
            {(r) => <Row label={r.id} chars={r.chars} whole={messagesTotal()} width={gaugeWidth(p.space)} color={r.color} />}
          </For>
          <text> </text>
          <text fg={PALETTE.dim}>Share of messages. Total {short(messagesTotal())} chars.</text>
        </Card>
      )

      const LargestCard = (p) => (
        <Card title="Largest fixed sections" grow={p.grow}>
          <For each={top()}>
            {(s) => (
              <text>
                <span fg={colorOf(s.category)}>{"● "}</span>
                <span fg={PALETTE.muted}>{pad(s.group, 8)}</span>
                <span fg={PALETTE.text}>{pad(s.name, Math.max(16, p.space - 21))}</span>
                <span fg={PALETTE.text}>{lpad(short(s.chars), 9)}</span>
              </text>
            )}
          </For>
        </Card>
      )

      return (
        <box flexDirection="column" paddingLeft={1} paddingRight={1} paddingTop={1}>
          <Show
            when={snap()}
            fallback={
              <Card title="Context">
                <text fg={PALETTE.muted}>{status()}</text>
              </Card>
            }
          >
            <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
              <text>
                <span bg={PALETTE.accent} fg={PALETTE.dark}>{" CONTEXT "}</span>
                <span>{"  "}</span>
                <span bg={PALETTE.border} fg={PALETTE.text}>{` ${snap().agent ?? "?"} `}</span>
                <span>{" "}</span>
                <span bg={PALETTE.track} fg={PALETTE.muted}>{` ${(snap().model ?? "").split("/").pop()} `}</span>
              </text>
              <text>
                <span fg={PALETTE.muted}>{"request "}</span>
                <span fg={PALETTE.text}>{String(snap().request)}</span>
                <span fg={PALETTE.dim}>{"   ·   "}</span>
                <span fg={PALETTE.text}>{fmt(total())}</span>
                <span fg={PALETTE.muted}>{" chars"}</span>
              </text>
            </box>

            <Show when={usage()?.used}>
              <Card title="Context window">
                <text>
                  <Gauge part={usage().used} whole={usage().limit || usage().used} width={inner()} color={windowColor()} />
                </text>
                <text> </text>
                <text>
                  <span fg={windowColor()}>{short(usage().used)}</span>
                  <span fg={PALETTE.muted}>{" tokens used"}</span>
                  <Show when={usage().limit}>
                    <span fg={PALETTE.muted}>{" of "}</span>
                    <span fg={PALETTE.text}>{short(usage().limit)}</span>
                    <span fg={PALETTE.dim}>{"   ·   "}</span>
                    <span fg={windowColor()}>{pct(usage().used, usage().limit)}</span>
                  </Show>
                </text>
              </Card>
            </Show>

            <Card title="Composition">
              <text>
                <For each={stacked()}>{(seg) => <span fg={seg.color}>{"█".repeat(seg.n)}</span>}</For>
              </text>
              <text> </text>
              <For each={byCategory()}>
                {(c) => <Row label={c.label} chars={c.chars} whole={total()} width={gaugeWidth(inner())} color={c.color} />}
              </For>
            </Card>

            <Show
              when={wide()}
              fallback={
                <>
                  <Show when={bySub().length}>
                    <MessagesCard space={inner()} />
                  </Show>
                  <LargestCard space={inner()} />
                </>
              }
            >
              <box flexDirection="row">
                <Show when={bySub().length}>
                  <MessagesCard space={halfInner()} grow />
                </Show>
                <box width={1} />
                <LargestCard space={halfInner()} grow />
              </box>
            </Show>

            <box paddingLeft={1} paddingTop={1} paddingBottom={1} flexDirection="column">
              <text fg={PALETTE.dim}>
                Characters are exact. Token figures (~t) spread the last response's real token count by character share.
              </text>
              <text> </text>
              <text>
                <Key k="r" label="refresh" />
                <Key k="f" label="fullscreen" />
                <Key k="esc" label="close" />
                <Show when={status()}>
                  <span fg={PALETTE.warn}>{status()}</span>
                </Show>
              </text>
            </box>
          </Show>
        </box>
      )
    }

    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === PANEL}>
          <ContextPanel panel={panel} />
        </Show>
      ),
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "context-inspector.show",
          title: "Show loaded context",
          group: "Context",
          palette: true,
          slash: { name: "context" },
          run: () => {
            const opened = context.ui.panel.open(PANEL, { presentation: "fullscreen" })
            if (opened === false) {
              context.ui.toast.show({ title: "Context", message: "Open a session first.", variant: "warning" })
            }
          },
        },
      ],
    }))
  },
}
