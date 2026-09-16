import { spawn } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const composeProject = "appyflow-integration";
const composeFile = resolve(projectRoot, "compose.integration.yaml");
const databaseUrl =
  "postgresql://appyflow_test:appyflow_test@127.0.0.1:5433/appyflow_test";

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...options.env },
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0 || options.allowFailure) {
        resolvePromise();
        return;
      }

      reject(
        new Error(`${command} terminou com código ${code ?? "desconhecido"}`),
      );
    });
  });
}

const composeArgs = ["compose", "-p", composeProject, "-f", composeFile];
const testEnvironment = {
  DATABASE_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl,
};

try {
  await run("docker", [...composeArgs, "up", "-d", "--wait"]);
  await run(
    process.execPath,
    [
      resolve(projectRoot, "node_modules/prisma/build/index.js"),
      "migrate",
      "deploy",
    ],
    { env: testEnvironment },
  );
  await run(
    process.execPath,
    [
      resolve(projectRoot, "node_modules/vitest/vitest.mjs"),
      "run",
      "--config",
      "vitest.integration.config.mts",
    ],
    { env: testEnvironment },
  );
} finally {
  await run("docker", [...composeArgs, "down", "--volumes"], {
    allowFailure: true,
  });
}
