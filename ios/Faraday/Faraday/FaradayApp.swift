import SwiftUI

@main
struct FaradayApp: App {
  @State private var store = ShopStore()

  var body: some Scene {
    WindowGroup {
      MainTabView()
        .environment(store)
        .preferredColorScheme(.dark)
    }
  }
}
