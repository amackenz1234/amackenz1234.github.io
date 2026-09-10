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

  enum CodingKeys: String, CodingKey {
    case sku, name, category, price
    case quantity = "qty"
    case descriptionText = "description"
    case imageURL = "image"
  }

  init(
    sku: String,
    name: String,
    category: String,
    price: Double,
    quantity: Int,
    descriptionText: String,
    imageURL: URL?
  ) {
    self.sku = sku
    self.name = name
    self.category = category
    self.price = price
    self.quantity = quantity
    self.descriptionText = descriptionText
    self.imageURL = imageURL
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    sku = try container.decode(String.self, forKey: .sku)
    name = try container.decode(String.self, forKey: .name)
    category = try container.decode(String.self, forKey: .category)
    price = try container.decode(Double.self, forKey: .price)
    quantity = try container.decode(Int.self, forKey: .quantity)
    descriptionText = try container.decode(String.self, forKey: .descriptionText)
    if let raw = try container.decodeIfPresent(String.self, forKey: .imageURL),
       !raw.isEmpty {
      imageURL = URL(string: raw)
    } else {
      imageURL = nil
    }
  }
}
