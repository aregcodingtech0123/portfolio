import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";
import { OWNER_IDENTITY } from "./identity";

describe("OWNER_IDENTITY", () => {
  it("job title matches the visible role badge in each locale", () => {
    expect(OWNER_IDENTITY.jobTitle.en).toBe(en.Hero.roleBadge);
    expect(OWNER_IDENTITY.jobTitle.tr).toBe(tr.Hero.roleBadge);
  });
});
