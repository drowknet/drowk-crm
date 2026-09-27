export type { RequestContext } from "@drowk/contracts";

export interface ApiHealth {
  service: "drowk-api";
  status: "ok";
}

export function health(): ApiHealth {
  return { service: "drowk-api", status: "ok" };
}
