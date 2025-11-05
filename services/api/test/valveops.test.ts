import { beforeAll, afterAll, describe, it, expect } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerValveOps } from "../src/modules/valveops";

let app: ReturnType<typeof Fastify>;

beforeAll(async () => {
  app = Fastify();
  await app.register(cors);
  registerValveOps(app);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("ValveOps", () => {
  it("lists valves", async () => {
    const res = await app.inject({ method: "GET", url: "/valves" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("id");
  });
});
