export type ProviderHealth =
  | { status: "available" }
  | {
      status: "unavailable";
      reason: "authentication" | "timeout" | "upstream";
    };
