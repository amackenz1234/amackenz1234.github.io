import Foundation

struct Product: Identifiable, Hashable, Codable {
  var id: String { sku }
  let sku: String
  let name: String
  let category: String
  let price: Double
  let quantity: Int
  let descriptionText: String
  let imageURL: URL?

  var isInStock: Bool { quantity > 0 }

  var formattedPrice: String {
    price.formatted(.currency(code: "CAD"))
  }
}
