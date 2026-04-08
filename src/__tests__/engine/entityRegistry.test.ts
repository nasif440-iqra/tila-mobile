import { describe, it, expect } from "vitest";
import {
  resolveEntity,
  resolveAll,
  hasCapability,
  filterByCapability,
} from "@/src/engine/v2/entityRegistry";

describe("entityRegistry", () => {
  describe("resolveEntity", () => {
    it("resolves a letter entity by ID", async () => {
      const entity = await resolveEntity("letter:2");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("letter:2");
      expect(entity!.displayArabic).toBe("\u0628");
    });

    it("resolves a chunk entity by ID", async () => {
      const entity = await resolveEntity("chunk:ba-ma");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("chunk:ba-ma");
    });

    it("resolves a combo entity by ID", async () => {
      const entity = await resolveEntity("combo:ba-fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("combo:ba-fatha");
    });

    it("resolves combo:ma-fatha correctly", async () => {
      const entity = await resolveEntity("combo:ma-fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("combo:ma-fatha");
      expect(entity!.displayArabic).toContain("\u0645");
    });

    it("resolves combo:la-fatha correctly", async () => {
      const entity = await resolveEntity("combo:la-fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("combo:la-fatha");
      expect(entity!.displayArabic).toContain("\u0644");
    });

    it("resolves a rule entity by ID", async () => {
      const entity = await resolveEntity("rule:fatha");
      expect(entity).toBeDefined();
      expect(entity!.id).toBe("rule:fatha");
    });

    it("returns undefined for unknown entity", async () => {
      const entity = await resolveEntity("letter:999");
      expect(entity).toBeUndefined();
    });

    it("returns undefined for invalid prefix", async () => {
      const entity = await resolveEntity("invalid:1");
      expect(entity).toBeUndefined();
    });
  });

  describe("resolveAll", () => {
    it("resolves multiple entities", async () => {
      const entities = await resolveAll(["letter:1", "letter:2", "chunk:ba-ma"]);
      expect(entities).toHaveLength(3);
    });

    it("filters out unresolvable IDs", async () => {
      const entities = await resolveAll(["letter:1", "letter:999"]);
      expect(entities).toHaveLength(1);
    });
  });

  describe("hasCapability", () => {
    it("returns true for a capability the entity has", async () => {
      const entity = await resolveEntity("chunk:ba-ma");
      expect(hasCapability(entity!, "readable")).toBe(true);
    });

    it("returns false for a capability the entity lacks", async () => {
      const entity = await resolveEntity("rule:rtl-reading");
      expect(hasCapability(entity!, "buildable")).toBe(false);
    });
  });

  describe("filterByCapability", () => {
    it("filters entities to only those with the capability", async () => {
      const entities = await resolveAll(["letter:1", "chunk:ba-ma", "rule:rtl-reading"]);
      const buildable = filterByCapability(entities, "buildable");
      expect(buildable).toHaveLength(1);
      expect(buildable[0].id).toBe("chunk:ba-ma");
    });
  });
});
