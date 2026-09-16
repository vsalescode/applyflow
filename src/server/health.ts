import { type Environment, parseServerEnv } from "@/server/config/env";

type HealthStatus = "ok" | "error";

export interface LivenessPayload {
  service: "appyflow";
  status: HealthStatus;
  timestamp: string;
}

export interface ReadinessPayload extends LivenessPayload {
  checks: {
    configuration: HealthStatus;
  };
}

type Clock = () => Date;

export function createLivenessPayload(
  clock: Clock = () => new Date(),
): LivenessPayload {
  return {
    service: "appyflow",
    status: "ok",
    timestamp: clock().toISOString(),
  };
}

export function createReadinessPayload(
  environment: Environment,
  clock: Clock = () => new Date(),
): { payload: ReadinessPayload; status: 200 | 503 } {
  const base = createLivenessPayload(clock);

  try {
    parseServerEnv(environment);

    return {
      payload: {
        ...base,
        checks: { configuration: "ok" },
      },
      status: 200,
    };
  } catch {
    return {
      payload: {
        ...base,
        status: "error",
        checks: { configuration: "error" },
      },
      status: 503,
    };
  }
}
