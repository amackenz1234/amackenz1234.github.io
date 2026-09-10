import { createServer } from "node:http";
import worker from "./nativ-plan.mjs";

const port = Number(process.env.PORT || 8789);
const env = {
  MOCK_PLAN: process.env.MOCK_PLAN || "1",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  PLAN_PRICE_ID: process.env.PLAN_PRICE_ID || "price_1UDyrEAZ8aLPU3hFOHtMe7zm",
  SITE_ORIGIN: process.env.SITE_ORIGIN || "http://127.0.0.1:8000",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
};

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const url = new URL(req.url, "http://127.0.0.1:" + port);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
  });
  const response = await worker.fetch(request, env);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(port, () => {
  console.log("Nativ Cloud Mac plan on http://127.0.0.1:" + port);
});
