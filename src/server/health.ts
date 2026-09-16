import { type Environment, parseServerEnv } from "@/server/config/env";
import { parseProviderConfiguration } from "@/server/config/providers";

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
    providers: CheckStatus;
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
        checks: {
          configuration: "error",
          database: "skipped",
          providers: "skipped",
        },
      },
      status: 503,
    };
  }

  let providers: CheckStatus;
  try {
    const providerConfiguration = parseProviderConfiguration(environment);
    providers =
      providerConfiguration.ai.enabled || providerConfiguration.search.enabled
        ? "ok"
        : "skipped";
  } catch {
    return {
      payload: {
        ...base,
        status: "error",
        checks: {
          configuration: "ok",
          database: "skipped",
          providers: "error",
        },
      },
      status: 503,
    };
  }

  try {
    await probeDatabase();

    return {
      payload: {
        ...base,
        checks: { configuration: "ok", database: "ok", providers },
      },
      status: 200,
    };
  } catch {
    return {
      payload: {
        ...base,
        status: "error",
        checks: { configuration: "ok", database: "error", providers },
      },
      status: 503,
    };
  }
}
