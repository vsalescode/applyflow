import { type Environment, parseServerEnv } from "@/server/config/env";

type HealthStatus = "ok" | "error";
type CheckStatus = HealthStatus | "skipped";

export interface LivenessPayload {
  service: "appyflow";
  status: HealthStatus;
  timestamp: string;
}

export interface ReadinessPayload extends LivenessPayload {
  checks: {
    configuration: CheckStatus;
    database: CheckStatus;
  };
}

type Clock = () => Date;
type DatabaseProbe = () => Promise<void>;

export function createLivenessPayload(
  clock: Clock = () => new Date(),
): LivenessPayload {
  return {
    service: "appyflow",
    status: "ok",
    timestamp: clock().toISOString(),
  };
}

export async function createReadinessPayload(
  environment: Environment,
  probeDatabase: DatabaseProbe,
  clock: Clock = () => new Date(),
): Promise<{ payload: ReadinessPayload; status: 200 | 503 }> {
  const base = createLivenessPayload(clock);

  try {
    parseServerEnv(environment);
  } catch {
    return {
      payload: {
        ...base,
        status: "error",
        checks: { configuration: "error", database: "skipped" },
      },
      status: 503,
    };
  }

  try {
    await probeDatabase();

    return {
      payload: {
        ...base,
        checks: { configuration: "ok", database: "ok" },
      },
      status: 200,
    };
  } catch {
    return {
      payload: {
        ...base,
        status: "error",
        checks: { configuration: "ok", database: "error" },
      },
      status: 503,
    };
  }
}
