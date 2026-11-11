// Generated from tui.tsx by scripts/build.mjs. Do not edit.
import { memo as _$memo } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
/** @jsxImportSource @opentui/solid */
// `/context` panel: visual breakdown of what the current session sent to the
// model on its latest request. Data comes from the server part over RPC and
// lives only in memory.
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { ContextInspector } from "./rpc.js";
const PANEL = "context-inspector";
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
  bad: "#f7768e"
};
const CATEGORIES = [{
  id: "instructions",
  label: "Instructions",
  color: "#7aa2f7"
}, {
  id: "skills",
  label: "Skills",
  color: "#bb9af7"
}, {
  id: "mcp",
  label: "MCP / Code Mode",
  color: "#e0af68"
}, {
  id: "agents",
  label: "Agents",
  color: "#9ece6a"
}, {
  id: "tools",
  label: "Built-in tools",
  color: "#7dcfff"
}, {
  id: "messages",
  label: "Messages",
  color: "#f7768e"
}];
const MESSAGE_SUBS = [{
  id: "tool output",
  color: "#f7768e"
}, {
  id: "tool calls",
  color: "#ff9e64"
}, {
  id: "assistant",
  color: "#e0af68"
}, {
  id: "reasoning",
  color: "#c0a36e"
}, {
  id: "user",
  color: "#73daca"
}, {
  id: "loaded skills",
  color: "#bb9af7"
}, {
  id: "other",
  color: "#7982a9"
}];
const fmt = n => Math.round(n).toLocaleString("en-US");
const short = n => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n));
const pct = (part, whole) => whole ? `${(100 * part / whole).toFixed(1)}%` : "0.0%";
const pad = (s, w) => String(s).slice(0, w).padEnd(w);
const lpad = (s, w) => String(s).padStart(w);
const filled = (part, whole, width) => {
  if (!whole || part <= 0) return 0;
  return Math.max(1, Math.min(width, Math.round(part / whole * width)));
};
function Gauge(props) {
  const n = () => filled(props.part, props.whole, props.width);
  return [(() => {
    var _el$ = _$createElement("span");
    _$insert(_el$, () => "█".repeat(n()));
    _$effect(_$p => _$setProp(_el$, "fg", props.color, _$p));
    return _el$;
  })(), (() => {
    var _el$2 = _$createElement("span");
    _$insert(_el$2, () => "░".repeat(Math.max(0, props.width - n())));
    _$effect(_$p => _$setProp(_el$2, "fg", PALETTE.track, _$p));
    return _el$2;
  })()];
}
function Card(props) {
  return (() => {
    var _el$3 = _$createElement("box");
    _$setProp(_el$3, "flexDirection", "column");
    _$setProp(_el$3, "border", true);
    _$setProp(_el$3, "borderStyle", "rounded");
    _$setProp(_el$3, "paddingLeft", 2);
    _$setProp(_el$3, "paddingRight", 2);
    _$setProp(_el$3, "paddingTop", 1);
    _$setProp(_el$3, "paddingBottom", 1);
    _$setProp(_el$3, "marginTop", 1);
    _$insert(_el$3, () => props.children);
    _$effect(_p$ => {
      var _v$ = PALETTE.border,
        _v$2 = ` ${props.title} `,
        _v$3 = props.grow ? 1 : 0,
        _v$4 = props.width;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$3, "title", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$3, "flexGrow", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$3, "width", _v$4, _p$.o));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$3;
  })();
}
function Key(props) {
  return [(() => {
    var _el$4 = _$createElement("span");
    _$insert(_el$4, () => ` ${props.k} `);
    _$effect(_p$ => {
      var _v$5 = PALETTE.border,
        _v$6 = PALETTE.text;
      _v$5 !== _p$.e && (_p$.e = _$setProp(_el$4, "bg", _v$5, _p$.e));
      _v$6 !== _p$.t && (_p$.t = _$setProp(_el$4, "fg", _v$6, _p$.t));
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$4;
  })(), (() => {
    var _el$5 = _$createElement("span");
    _$insert(_el$5, () => ` ${props.label}   `);
    _$effect(_$p => _$setProp(_el$5, "fg", PALETTE.muted, _$p));
    return _el$5;
  })()];
}
export default {
  id: "context-inspector.tui",
  setup(context) {
    async function tokenUsage(sessionID) {
      try {
        await context.data.session.message.sync(sessionID);
        const messages = context.data.session.message.list(sessionID) ?? [];
        const last = messages.filter(m => m?.type === "assistant" && m.tokens).sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))[0];
        if (!last) return undefined;
        const t = last.tokens;
        const used = (t.input ?? 0) + (t.cache?.read ?? 0) + (t.cache?.write ?? 0);
        let limit;
        try {
          const location = context.location ?? context.data.location.default();
          await context.data.location.model.sync(location);
          const models = context.data.location.model.list(location) ?? [];
          const model = models.find(m => m?.id === last.model?.id && m?.providerID === last.model?.providerID);
          limit = model?.limit?.context;
        } catch {}
        return {
          used,
          limit
        };
      } catch {
        return undefined;
      }
    }
    function ContextPanel(props) {
      const [snap, setSnap] = createSignal();
      const [usage, setUsage] = createSignal();
      const [status, setStatus] = createSignal("Loading…");
      const load = async () => {
        const sessionID = props.panel.sessionID;
        if (!sessionID) return setStatus("Open a session first.");
        try {
          const result = await context.client.rpc(ContextInspector).get({
            sessionID
          });
          if (!result?.found) {
            setSnap(undefined);
            setStatus("No model request recorded for this session yet. Send a prompt, then press r.");
            return;
          }
          setSnap(result.snapshot);
          setStatus("");
          setUsage(await tokenUsage(sessionID));
        } catch (err) {
          setStatus(`Error: ${String(err?.message ?? err)}`);
        }
      };
      load();
      const stop = context.data.on("session.execution.succeeded", () => load());
      onCleanup(() => stop?.());
      context.keymap.layer(() => ({
        commands: [{
          id: "context-inspector.refresh",
          title: "Refresh context",
          bind: "r",
          run: () => load()
        }, {
          id: "context-inspector.fullscreen",
          title: "Toggle fullscreen",
          bind: "f",
          run: () => props.panel.toggleFullscreen()
        }, {
          id: "context-inspector.close",
          title: "Close context",
          bind: "escape",
          run: () => props.panel.close()
        }]
      }));

      // Layout: outer padding 2 + card border 2 + card padding 4.
      const panelWidth = () => Math.max(60, props.panel.width ?? 100);
      const inner = () => panelWidth() - 8;
      const wide = () => panelWidth() >= 140;
      const halfInner = () => Math.floor((panelWidth() - 4) / 2) - 7;
      // Row: marker 2 + label 18 + gap 2 + gauge + chars 9 + tokens 11 + pct 8.
      const gaugeWidth = space => Math.max(10, space - 50);
      const sections = () => snap()?.sections ?? [];
      const total = createMemo(() => sections().reduce((a, s) => a + s.chars, 0));
      const byCategory = createMemo(() => CATEGORIES.map(c => ({
        ...c,
        chars: sections().filter(s => s.category === c.id).reduce((a, s) => a + s.chars, 0)
      })));
      const messagesTotal = createMemo(() => byCategory().find(c => c.id === "messages")?.chars ?? 0);
      const bySub = createMemo(() => MESSAGE_SUBS.map(m => ({
        ...m,
        chars: sections().filter(s => s.sub === m.id).reduce((a, s) => a + s.chars, 0)
      })).filter(r => r.chars > 0));
      const top = createMemo(() => [...sections()].filter(s => s.group !== "messages").sort((a, b) => b.chars - a.chars).slice(0, 10));
      const tokensOf = chars => usage()?.used && total() ? usage().used * chars / total() : undefined;
      const colorOf = id => CATEGORIES.find(c => c.id === id)?.color ?? PALETTE.text;
      const windowShare = () => usage()?.limit ? usage().used / usage().limit : 0;
      const windowColor = () => windowShare() > 0.8 ? PALETTE.bad : windowShare() > 0.5 ? PALETTE.warn : PALETTE.ok;
      const stacked = () => {
        const width = inner();
        let used = 0;
        return byCategory().filter(c => c.chars > 0).map((c, i, list) => {
          const n = i === list.length - 1 ? width - used : filled(c.chars, total(), width);
          used += n;
          return {
            color: c.color,
            n: Math.max(0, n)
          };
        });
      };
      const Row = p => (() => {
        var _el$6 = _$createElement("text"),
          _el$7 = _$createElement("span"),
          _el$9 = _$createElement("span"),
          _el$0 = _$createElement("span"),
          _el$10 = _$createElement("span"),
          _el$11 = _$createElement("span"),
          _el$12 = _$createElement("span");
        _$insertNode(_el$6, _el$7);
        _$insertNode(_el$6, _el$9);
        _$insertNode(_el$6, _el$0);
        _$insertNode(_el$6, _el$10);
        _$insertNode(_el$6, _el$11);
        _$insertNode(_el$6, _el$12);
        _$insertNode(_el$7, _$createTextNode(`● `));
        _$insert(_el$9, () => pad(p.label, 18));
        _$insertNode(_el$0, _$createTextNode(`  `));
        _$insert(_el$6, _$createComponent(Gauge, {
          get part() {
            return p.chars;
          },
          get whole() {
            return p.whole;
          },
          get width() {
            return p.width;
          },
          get color() {
            return p.color;
          }
        }), _el$10);
        _$insert(_el$10, () => lpad(short(p.chars), 9));
        _$insert(_el$11, () => lpad(tokensOf(p.chars) ? `~${short(tokensOf(p.chars))}t` : "", 11));
        _$insert(_el$12, () => lpad(pct(p.chars, p.whole), 8));
        _$effect(_p$ => {
          var _v$7 = p.color,
            _v$8 = PALETTE.text,
            _v$9 = PALETTE.text,
            _v$0 = PALETTE.dim,
            _v$1 = p.color;
          _v$7 !== _p$.e && (_p$.e = _$setProp(_el$7, "fg", _v$7, _p$.e));
          _v$8 !== _p$.t && (_p$.t = _$setProp(_el$9, "fg", _v$8, _p$.t));
          _v$9 !== _p$.a && (_p$.a = _$setProp(_el$10, "fg", _v$9, _p$.a));
          _v$0 !== _p$.o && (_p$.o = _$setProp(_el$11, "fg", _v$0, _p$.o));
          _v$1 !== _p$.i && (_p$.i = _$setProp(_el$12, "fg", _v$1, _p$.i));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined,
          o: undefined,
          i: undefined
        });
        return _el$6;
      })();
      const MessagesCard = p => _$createComponent(Card, {
        title: "Messages",
        get grow() {
          return p.grow;
        },
        get children() {
          return [_$createComponent(For, {
            get each() {
              return bySub();
            },
            children: r => _$createComponent(Row, {
              get label() {
                return r.id;
              },
              get chars() {
                return r.chars;
              },
              get whole() {
                return messagesTotal();
              },
              get width() {
                return gaugeWidth(p.space);
              },
              get color() {
                return r.color;
              }
            })
          }), (() => {
            var _el$13 = _$createElement("text");
            _$insertNode(_el$13, _$createTextNode(` `));
            return _el$13;
          })(), (() => {
            var _el$15 = _$createElement("text"),
              _el$16 = _$createTextNode(`Share of messages. Total `),
              _el$17 = _$createTextNode(` chars.`);
            _$insertNode(_el$15, _el$16);
            _$insertNode(_el$15, _el$17);
            _$insert(_el$15, () => short(messagesTotal()), _el$17);
            _$effect(_$p => _$setProp(_el$15, "fg", PALETTE.dim, _$p));
            return _el$15;
          })()];
        }
      });
      const LargestCard = p => _$createComponent(Card, {
        title: "Largest fixed sections",
        get grow() {
          return p.grow;
        },
        get children() {
          return _$createComponent(For, {
            get each() {
              return top();
            },
            children: s => (() => {
              var _el$18 = _$createElement("text"),
                _el$19 = _$createElement("span"),
                _el$21 = _$createElement("span"),
                _el$22 = _$createElement("span"),
                _el$23 = _$createElement("span");
              _$insertNode(_el$18, _el$19);
              _$insertNode(_el$18, _el$21);
              _$insertNode(_el$18, _el$22);
              _$insertNode(_el$18, _el$23);
              _$insertNode(_el$19, _$createTextNode(`● `));
              _$insert(_el$21, () => pad(s.group, 8));
              _$insert(_el$22, () => pad(s.name, Math.max(16, p.space - 21)));
              _$insert(_el$23, () => lpad(short(s.chars), 9));
              _$effect(_p$ => {
                var _v$10 = colorOf(s.category),
                  _v$11 = PALETTE.muted,
                  _v$12 = PALETTE.text,
                  _v$13 = PALETTE.text;
                _v$10 !== _p$.e && (_p$.e = _$setProp(_el$19, "fg", _v$10, _p$.e));
                _v$11 !== _p$.t && (_p$.t = _$setProp(_el$21, "fg", _v$11, _p$.t));
                _v$12 !== _p$.a && (_p$.a = _$setProp(_el$22, "fg", _v$12, _p$.a));
                _v$13 !== _p$.o && (_p$.o = _$setProp(_el$23, "fg", _v$13, _p$.o));
                return _p$;
              }, {
                e: undefined,
                t: undefined,
                a: undefined,
                o: undefined
              });
              return _el$18;
            })()
          });
        }
      });
      return (() => {
        var _el$24 = _$createElement("box");
        _$setProp(_el$24, "flexDirection", "column");
        _$setProp(_el$24, "paddingLeft", 1);
        _$setProp(_el$24, "paddingRight", 1);
        _$setProp(_el$24, "paddingTop", 1);
        _$insert(_el$24, _$createComponent(Show, {
          get when() {
            return snap();
          },
          get fallback() {
            return _$createComponent(Card, {
              title: "Context",
              get children() {
                var _el$69 = _$createElement("text");
                _$insert(_el$69, status);
                _$effect(_$p => _$setProp(_el$69, "fg", PALETTE.muted, _$p));
                return _el$69;
              }
            });
          },
          get children() {
            return [(() => {
              var _el$25 = _$createElement("box"),
                _el$26 = _$createElement("text"),
                _el$27 = _$createElement("span"),
                _el$29 = _$createElement("span"),
                _el$31 = _$createElement("span"),
                _el$32 = _$createElement("span"),
                _el$34 = _$createElement("span"),
                _el$35 = _$createElement("text"),
                _el$36 = _$createElement("span"),
                _el$38 = _$createElement("span"),
                _el$39 = _$createElement("span"),
                _el$41 = _$createElement("span"),
                _el$42 = _$createElement("span");
              _$insertNode(_el$25, _el$26);
              _$insertNode(_el$25, _el$35);
              _$setProp(_el$25, "flexDirection", "row");
              _$setProp(_el$25, "justifyContent", "space-between");
              _$setProp(_el$25, "paddingLeft", 1);
              _$setProp(_el$25, "paddingRight", 1);
              _$insertNode(_el$26, _el$27);
              _$insertNode(_el$26, _el$29);
              _$insertNode(_el$26, _el$31);
              _$insertNode(_el$26, _el$32);
              _$insertNode(_el$26, _el$34);
              _$insertNode(_el$27, _$createTextNode(` CONTEXT `));
              _$insertNode(_el$29, _$createTextNode(`  `));
              _$insert(_el$31, () => ` ${snap().agent ?? "?"} `);
              _$insertNode(_el$32, _$createTextNode(` `));
              _$insert(_el$34, () => ` ${(snap().model ?? "").split("/").pop()} `);
              _$insertNode(_el$35, _el$36);
              _$insertNode(_el$35, _el$38);
              _$insertNode(_el$35, _el$39);
              _$insertNode(_el$35, _el$41);
              _$insertNode(_el$35, _el$42);
              _$insertNode(_el$36, _$createTextNode(`request `));
              _$insert(_el$38, () => String(snap().request));
              _$insertNode(_el$39, _$createTextNode(`   ·   `));
              _$insert(_el$41, () => fmt(total()));
              _$insertNode(_el$42, _$createTextNode(` chars`));
              _$effect(_p$ => {
                var _v$14 = PALETTE.accent,
                  _v$15 = PALETTE.dark,
                  _v$16 = PALETTE.border,
                  _v$17 = PALETTE.text,
                  _v$18 = PALETTE.track,
                  _v$19 = PALETTE.muted,
                  _v$20 = PALETTE.muted,
                  _v$21 = PALETTE.text,
                  _v$22 = PALETTE.dim,
                  _v$23 = PALETTE.text,
                  _v$24 = PALETTE.muted;
                _v$14 !== _p$.e && (_p$.e = _$setProp(_el$27, "bg", _v$14, _p$.e));
                _v$15 !== _p$.t && (_p$.t = _$setProp(_el$27, "fg", _v$15, _p$.t));
                _v$16 !== _p$.a && (_p$.a = _$setProp(_el$31, "bg", _v$16, _p$.a));
                _v$17 !== _p$.o && (_p$.o = _$setProp(_el$31, "fg", _v$17, _p$.o));
                _v$18 !== _p$.i && (_p$.i = _$setProp(_el$34, "bg", _v$18, _p$.i));
                _v$19 !== _p$.n && (_p$.n = _$setProp(_el$34, "fg", _v$19, _p$.n));
                _v$20 !== _p$.s && (_p$.s = _$setProp(_el$36, "fg", _v$20, _p$.s));
                _v$21 !== _p$.h && (_p$.h = _$setProp(_el$38, "fg", _v$21, _p$.h));
                _v$22 !== _p$.r && (_p$.r = _$setProp(_el$39, "fg", _v$22, _p$.r));
                _v$23 !== _p$.d && (_p$.d = _$setProp(_el$41, "fg", _v$23, _p$.d));
                _v$24 !== _p$.l && (_p$.l = _$setProp(_el$42, "fg", _v$24, _p$.l));
                return _p$;
              }, {
                e: undefined,
                t: undefined,
                a: undefined,
                o: undefined,
                i: undefined,
                n: undefined,
                s: undefined,
                h: undefined,
                r: undefined,
                d: undefined,
                l: undefined
              });
              return _el$25;
            })(), _$createComponent(Show, {
              get when() {
                return usage()?.used;
              },
              get children() {
                return _$createComponent(Card, {
                  title: "Context window",
                  get children() {
                    return [(() => {
                      var _el$44 = _$createElement("text");
                      _$insert(_el$44, _$createComponent(Gauge, {
                        get part() {
                          return usage().used;
                        },
                        get whole() {
                          return usage().limit || usage().used;
                        },
                        get width() {
                          return inner();
                        },
                        get color() {
                          return windowColor();
                        }
                      }));
                      return _el$44;
                    })(), (() => {
                      var _el$45 = _$createElement("text");
                      _$insertNode(_el$45, _$createTextNode(` `));
                      return _el$45;
                    })(), (() => {
                      var _el$47 = _$createElement("text"),
                        _el$48 = _$createElement("span"),
                        _el$49 = _$createElement("span");
                      _$insertNode(_el$47, _el$48);
                      _$insertNode(_el$47, _el$49);
                      _$insert(_el$48, () => short(usage().used));
                      _$insertNode(_el$49, _$createTextNode(` tokens used`));
                      _$insert(_el$47, _$createComponent(Show, {
                        get when() {
                          return usage().limit;
                        },
                        get children() {
                          return [(() => {
                            var _el$51 = _$createElement("span");
                            _$insertNode(_el$51, _$createTextNode(` of `));
                            _$effect(_$p => _$setProp(_el$51, "fg", PALETTE.muted, _$p));
                            return _el$51;
                          })(), (() => {
                            var _el$53 = _$createElement("span");
                            _$insert(_el$53, () => short(usage().limit));
                            _$effect(_$p => _$setProp(_el$53, "fg", PALETTE.text, _$p));
                            return _el$53;
                          })(), (() => {
                            var _el$54 = _$createElement("span");
                            _$insertNode(_el$54, _$createTextNode(`   ·   `));
                            _$effect(_$p => _$setProp(_el$54, "fg", PALETTE.dim, _$p));
                            return _el$54;
                          })(), (() => {
                            var _el$56 = _$createElement("span");
                            _$insert(_el$56, () => pct(usage().used, usage().limit));
                            _$effect(_$p => _$setProp(_el$56, "fg", windowColor(), _$p));
                            return _el$56;
                          })()];
                        }
                      }), null);
                      _$effect(_p$ => {
                        var _v$25 = windowColor(),
                          _v$26 = PALETTE.muted;
                        _v$25 !== _p$.e && (_p$.e = _$setProp(_el$48, "fg", _v$25, _p$.e));
                        _v$26 !== _p$.t && (_p$.t = _$setProp(_el$49, "fg", _v$26, _p$.t));
                        return _p$;
                      }, {
                        e: undefined,
                        t: undefined
                      });
                      return _el$47;
                    })()];
                  }
                });
              }
            }), _$createComponent(Card, {
              title: "Composition",
              get children() {
                return [(() => {
                  var _el$57 = _$createElement("text");
                  _$insert(_el$57, _$createComponent(For, {
                    get each() {
                      return stacked();
                    },
                    children: seg => (() => {
                      var _el$70 = _$createElement("span");
                      _$insert(_el$70, () => "█".repeat(seg.n));
                      _$effect(_$p => _$setProp(_el$70, "fg", seg.color, _$p));
                      return _el$70;
                    })()
                  }));
                  return _el$57;
                })(), (() => {
                  var _el$58 = _$createElement("text");
                  _$insertNode(_el$58, _$createTextNode(` `));
                  return _el$58;
                })(), _$createComponent(For, {
                  get each() {
                    return byCategory();
                  },
                  children: c => _$createComponent(Row, {
                    get label() {
                      return c.label;
                    },
                    get chars() {
                      return c.chars;
                    },
                    get whole() {
                      return total();
                    },
                    get width() {
                      return gaugeWidth(inner());
                    },
                    get color() {
                      return c.color;
                    }
                  })
                })];
              }
            }), _$createComponent(Show, {
              get when() {
                return wide();
              },
              get fallback() {
                return [_$createComponent(Show, {
                  get when() {
                    return bySub().length;
                  },
                  get children() {
                    return _$createComponent(MessagesCard, {
                      get space() {
                        return inner();
                      }
                    });
                  }
                }), _$createComponent(LargestCard, {
                  get space() {
                    return inner();
                  }
                })];
              },
              get children() {
                var _el$60 = _$createElement("box"),
                  _el$61 = _$createElement("box");
                _$insertNode(_el$60, _el$61);
                _$setProp(_el$60, "flexDirection", "row");
                _$insert(_el$60, _$createComponent(Show, {
                  get when() {
                    return bySub().length;
                  },
                  get children() {
                    return _$createComponent(MessagesCard, {
                      get space() {
                        return halfInner();
                      },
                      grow: true
                    });
                  }
                }), _el$61);
                _$setProp(_el$61, "width", 1);
                _$insert(_el$60, _$createComponent(LargestCard, {
                  get space() {
                    return halfInner();
                  },
                  grow: true
                }), null);
                return _el$60;
              }
            }), (() => {
              var _el$62 = _$createElement("box"),
                _el$63 = _$createElement("text"),
                _el$65 = _$createElement("text"),
                _el$67 = _$createElement("text");
              _$insertNode(_el$62, _el$63);
              _$insertNode(_el$62, _el$65);
              _$insertNode(_el$62, _el$67);
              _$setProp(_el$62, "paddingLeft", 1);
              _$setProp(_el$62, "paddingTop", 1);
              _$setProp(_el$62, "paddingBottom", 1);
              _$setProp(_el$62, "flexDirection", "column");
              _$insertNode(_el$63, _$createTextNode(`Characters are exact. Token figures (~t) spread the last response's real token count by character share.`));
              _$insertNode(_el$65, _$createTextNode(` `));
              _$insert(_el$67, _$createComponent(Key, {
                k: "r",
                label: "refresh"
              }), null);
              _$insert(_el$67, _$createComponent(Key, {
                k: "f",
                label: "fullscreen"
              }), null);
              _$insert(_el$67, _$createComponent(Key, {
                k: "esc",
                label: "close"
              }), null);
              _$insert(_el$67, _$createComponent(Show, {
                get when() {
                  return status();
                },
                get children() {
                  var _el$68 = _$createElement("span");
                  _$insert(_el$68, status);
                  _$effect(_$p => _$setProp(_el$68, "fg", PALETTE.warn, _$p));
                  return _el$68;
                }
              }), null);
              _$effect(_$p => _$setProp(_el$63, "fg", PALETTE.dim, _$p));
              return _el$62;
            })()];
          }
        }));
        return _el$24;
      })();
    }
    context.ui.slot({
      append: "session.panel",
      render: panel => _$createComponent(Show, {
        get when() {
          return panel.name === PANEL;
        },
        get children() {
          return _$createComponent(ContextPanel, {
            panel: panel
          });
        }
      })
    });
    context.keymap.layer(() => ({
      mode: "global",
      commands: [{
        id: "context-inspector.show",
        title: "Show loaded context",
        group: "Context",
        palette: true,
        slash: {
          name: "context"
        },
        run: () => {
          const opened = context.ui.panel.open(PANEL, {
            presentation: "fullscreen"
          });
          if (opened === false) {
            context.ui.toast.show({
              title: "Context",
              message: "Open a session first.",
              variant: "warning"
            });
          }
        }
      }]
    }));
  }
};
