const PROJECT_REF = /^[a-z]{20}$/;

export function assertDisposableTarget(inputs) {
  if (inputs.environment !== "development") throw new Error("Reset requires APP_ENVIRONMENT=development.");
  if (inputs.acknowledgement !== "DELETE DEV DATA") throw new Error("Reset requires the exact process-only acknowledgement.");
  let url;
  try { url = new URL(inputs.supabaseUrl); } catch { throw new Error("Reset requires a valid Supabase origin."); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Supabase URL must be an origin without credentials, path, query or fragment.");
  }
  if (inputs.mode === "local") {
    if (url.protocol !== "http:" || url.port !== "54321" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error("Local reset requires the CLI loopback endpoint on port 54321.");
    }
    return { mode: "local", projectRef: null };
  }
  if (inputs.mode !== "linked") throw new Error("Reset mode must be local or linked.");
  if (![inputs.expectedRef, inputs.linkedRef].every((value) => typeof value === "string" && PROJECT_REF.test(value)) || !(inputs.productionRef === "none" || (typeof inputs.productionRef === "string" && PROJECT_REF.test(inputs.productionRef)))) {
    throw new Error("Linked reset requires valid expected/linked refs and an explicit production ref or none declaration.");
  }
  if (inputs.expectedRef === inputs.productionRef || inputs.linkedRef === inputs.productionRef) throw new Error("Production project is excluded from reset.");
  if (inputs.expectedRef !== inputs.linkedRef || url.protocol !== "https:" || url.port || url.hostname !== `${inputs.expectedRef}.supabase.co`) {
    throw new Error("Expected, linked and URL project refs must match exactly.");
  }
  return { mode: "linked", projectRef: inputs.expectedRef };
}
