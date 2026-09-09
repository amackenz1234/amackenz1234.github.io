import Foundation
import Observation

@Observable
final class ShopStore {
  var category: String = "All"
  var query: String = ""
  var path: [Product] = []

  let products: [Product]

  init(products: [Product] = Catalog.products) {
    self.products = products
  }

  var categories: [String] {
    let unique = Set(products.map(\.category))
    return ["All"] + unique.sorted()
  }

  var featuredProduct: Product? {
    products.first(where: { $0.isInStock && $0.imageURL != nil })
      ?? products.first(where: { $0.imageURL != nil })
  }

  var filteredProducts: [Product] {
    let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    return products.filter { product in
      let matchesCategory = category == "All" || product.category == category
      guard matchesCategory else { return false }
      if needle.isEmpty { return true }
      return product.name.lowercased().contains(needle)
        || product.sku.lowercased().contains(needle)
        || product.descriptionText.lowercased().contains(needle)
    }
  }

  var inStockCount: Int {
    products.filter(\.isInStock).count
  }

  func open(_ product: Product) {
    path.append(product)
  }
}
