import { Rpc } from "@opencode/plugin/rpc"

const session = {
  type: "object",
  properties: { sessionID: { type: "string" } },
  required: ["sessionID"],
  additionalProperties: false,
}

export const ContextInspector = Rpc.define({
  id: "context-inspector",
  methods: {
    // Section sizes of the latest model request for a session.
    get: {
      input: session,
      output: {
        type: "object",
        properties: { found: { type: "boolean" }, snapshot: { type: "object" } },
        required: ["found"],
      },
      errors: {},
    },
    // Full text of one section from that request.
    section: {
      input: {
        type: "object",
        properties: { sessionID: { type: "string" }, sectionID: { type: "string" } },
        required: ["sessionID", "sectionID"],
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: { found: { type: "boolean" }, text: { type: "string" } },
        required: ["found"],
      },
      errors: {},
    },
  },
  events: {},
})

export default ContextInspector
