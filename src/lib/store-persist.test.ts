import { beforeEach, describe, expect, it } from "vitest";
import { persistRead, persistWrite } from "./store-persist";

describe("store-persist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips via persistRead/persistWrite", () => {
    persistWrite("demo", { x: 1 });
    expect(persistRead("demo", {})).toEqual({ x: 1 });
  });
});
