# Electro Cycles MCP Server

Local stdio MCP server that exposes the Electro Cycles catalog to Cursor.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_categories` | List product categories |
| `list_products` | List inventory (optional category / in-stock filters) |
| `search_products` | Search by name, SKU, or description |
| `get_product` | Fetch one product by SKU |
| `get_shop_info` | Shop phone, email, GST/HST |

## Resource

- `electro-cycles://catalog` — full catalog JSON

## Setup

```bash
cd mcp/electro-cycles
npm install
```

Project MCP config lives at `.cursor/mcp.json`. After installing deps, reload MCP servers in Cursor.

## Run manually

```bash
npm start
```

The process speaks MCP over stdio (logs go to stderr).
