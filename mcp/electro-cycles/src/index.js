#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  categories,
  getProduct,
  getShopInfo,
  listProducts,
  searchProducts,
} from "./catalog.js";

const server = new McpServer({
  name: "electro-cycles",
  version: "1.0.0",
});

server.registerTool(
  "list_categories",
  {
    title: "List categories",
    description: "List Electro Cycles product categories.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(categories(), null, 2) }],
  })
);

server.registerTool(
  "list_products",
  {
    title: "List products",
    description:
      "List Electro Cycles inventory. Optionally filter by category and stock.",
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe("Category filter, e.g. E-Bikes, E-Scooters, Mobility, Accessories"),
      in_stock_only: z
        .boolean()
        .optional()
        .describe("When true, only return products with qty > 0"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Max products to return (default 25)"),
    }),
  },
  async ({ category, in_stock_only, limit }) => {
    const items = listProducts({ category, inStockOnly: in_stock_only, limit });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: items.length, products: items }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "search_products",
  {
    title: "Search products",
    description:
      "Search Electro Cycles products by name, SKU, category, or description.",
    inputSchema: z.object({
      query: z.string().describe("Search text"),
      category: z.string().optional().describe("Optional category filter"),
      in_stock_only: z.boolean().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
  },
  async ({ query, category, in_stock_only, limit }) => {
    const items = searchProducts({
      query,
      category,
      inStockOnly: in_stock_only,
      limit,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: items.length, products: items }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "get_product",
  {
    title: "Get product",
    description: "Get one Electro Cycles product by SKU.",
    inputSchema: z.object({
      sku: z.string().describe("Product SKU, e.g. EC-BANDIT"),
    }),
  },
  async ({ sku }) => {
    const product = getProduct(sku);
    if (!product) {
      return {
        content: [{ type: "text", text: `No product found for SKU ${sku}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
    };
  }
);

server.registerTool(
  "get_shop_info",
  {
    title: "Get shop info",
    description: "Return Electro Cycles contact and shop details.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(getShopInfo(), null, 2) }],
  })
);

server.registerResource(
  "catalog",
  "electro-cycles://catalog",
  {
    title: "Full catalog",
    description: "Complete Electro Cycles product catalog as JSON",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(listProducts({ limit: 100 }), null, 2),
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("electro-cycles MCP server running on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
