import SwiftUI

@main
struct ElectroCyclesApp: App {
  @State private var store = ShopStore()

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(store)
        .preferredColorScheme(.dark)
    }
  }
}
