import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { BASE_URL, PORT, perfEnv } from "./env.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

function runNext(args, { quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      env: { ...process.env, ...perfEnv },
      stdio: quiet ? "ignore" : "inherit",
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`next ${args.join(" ")} exited ${code}`)),
    );
  });
}

export function build() {
  return runNext(["build"]);
}

/** Starts `next start` and resolves once /en answers. Returns a stop() fn. */
export async function start() {
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    env: { ...process.env, ...perfEnv, NODE_ENV: "production" },
    stdio: "ignore",
  });
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  const deadline = Date.now() + 60_000;
  for (;;) {
    if (exited) throw new Error(`next start exited early (is port ${PORT} taken?)`);
    try {
      const res = await fetch(`${BASE_URL}/en`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error("next start did not come up in 60s");
    await new Promise((r) => setTimeout(r, 300));
  }
  return () => child.kill();
}
