import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-decision-room",
  displayName: "Decision Room",
  visualProfile: "utility",
  shellLayout: "inset",
  description: "A shared shortlist and ranked ballot for small groups.",
  accentHex: "#73c7bd",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
