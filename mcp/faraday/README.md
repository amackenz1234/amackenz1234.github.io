# Faraday MCP Server

Local stdio MCP server that exposes the Faraday catalog to Cursor.

## Tools

- `list_categories`
- `list_products`
- `search_products`
- `get_product`
- `get_shop_info`

## Resource

- `faraday://catalog` — full catalog JSON

```bash
cd mcp/faraday
npm ci
npm test
npm start
```
