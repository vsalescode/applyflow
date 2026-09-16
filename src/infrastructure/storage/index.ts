import { parseStorageConfiguration } from "@/server/config/storage";

import { LocalArtifactStorage } from "./local-artifact-storage";

let storage: LocalArtifactStorage | undefined;

export function getArtifactStorage() {
  storage ??= new LocalArtifactStorage(
    parseStorageConfiguration(process.env).artifactsDirectory,
  );
  return storage;
}
