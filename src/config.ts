import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "Mesh Decision Room",
  description: "A browser-local ranked decision room for small groups.",
  accentHex: "#c77dff",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
