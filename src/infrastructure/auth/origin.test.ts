import { afterEach, describe, expect, it } from "vitest";

import { hasTrustedOrigin } from "./origin";

const previousAppUrl = process.env.APP_URL;
const previousDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (previousAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = previousAppUrl;
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
});

describe("hasTrustedOrigin", () => {
  it("aceita somente a origem configurada", () => {
    process.env.APP_URL = "https://appyflow.example.com";
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/app";

    expect(
      hasTrustedOrigin(
        new Request("https://appyflow.example.com/api/auth/logout", {
          headers: { origin: "https://appyflow.example.com" },
        }),
      ),
    ).toBe(true);
    expect(
      hasTrustedOrigin(
        new Request("https://appyflow.example.com/api/auth/logout", {
          headers: { origin: "https://malicious.example.com" },
        }),
      ),
    ).toBe(false);
  });

  it("rejeita requisições sem Origin", () => {
    process.env.APP_URL = "https://appyflow.example.com";
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/app";

    expect(
      hasTrustedOrigin(
        new Request("https://appyflow.example.com/api/auth/logout"),
      ),
    ).toBe(false);
  });
});
