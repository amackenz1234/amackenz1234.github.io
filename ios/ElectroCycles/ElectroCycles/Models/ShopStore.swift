import Foundation
import Observation

@Observable
final class ShopStore {
  var category: String = "All"
  var query: String = ""
  var selectedProduct: Product?

  let products: [Product]

  init(products: [Product] = Catalog.products) {
    self.products = products
  }

  var categories: [String] {
    let unique = Set(products.map(\.category))
    return ["All"] + unique.sorted()
  }

  var filteredProducts: [Product] {
    let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    return products.filter { product in
      let matchesCategory = category == "All" || product.category == category
      guard matchesCategory else { return false }
      if needle.isEmpty { return true }
      return product.name.lowercased().contains(needle)
        || product.sku.lowercased().contains(needle)
    }
  }
}
