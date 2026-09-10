import Foundation

enum Catalog {
  static let phone = "9053085392"
  static let phoneDisplay = "905-308-5392"
  static let email = "hello@faradayrides.ca"
  static let gst = "729028506TZ0001"

  static let products: [Product] = {
    guard
      let url = Bundle.main.url(forResource: "products", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let decoded = try? JSONDecoder().decode([Product].self, from: data)
    else {
      return []
    }
    return decoded
  }()
}
