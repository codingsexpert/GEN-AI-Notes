/**
 * sandboxHealthCheck.js — LangGraph Node ⭐ V2 NEW
 * 
 * Runs health checks on the sandbox.
 * If healthy → proceed to dev loop (selectNextTask in Phase 4).
 * If unhealthy → retry setup (max 2) → human escalation.
 * 
 * Zero LLM calls — pure verification logic.
 */

import { healthCheck, getSandboxPath } from "../utils/sandboxManager.js";

const MAX_RETRIES = 2;

export async function sandboxHealthCheckNode(state) {
  console.log("\n🏥 [Sandbox Health Check] Verifying workspace...\n");

  const { sandboxId } = state;

  if (!sandboxId) {
    console.log("   ❌ No sandbox ID found");
    return {
      sandboxHealthy: false,
      error: "No sandbox ID — setup may have failed",
    };
  }

  const result = await healthCheck(sandboxId);

  if (result.healthy) {
    console.log("   ✅ All health checks passed!");
    console.log(`   📂 Sandbox path: ${result.sandboxPath}`);
    return {
      sandboxHealthy: true,
    };
  }

  // Health check failed
  console.log("   ❌ Health check failures:");
  result.failures.forEach(f => console.log(`   • ${f}`));

  return {
    sandboxHealthy: false,
    error: `Sandbox unhealthy: ${result.failures.join("; ")}`,
  };
}

/**
 * Router for sandbox health check
 * Returns: "__end__" (healthy/done) | "setupSandbox" (retry) | "humanEscalation" (give up)
 */
export function sandboxHealthRouter(state) {
  if (state.sandboxHealthy) {
    return "__end__"; // Phase 3 ends. Phase 4 will route to selectNextTask.
  }

  // For now, if unhealthy, just end with error.
  // In Phase 5 we'll add humanEscalation node.
  console.log("   ⚠️ Sandbox unhealthy — ending with error. Fix manually and retry.");
  return "__end__";
}