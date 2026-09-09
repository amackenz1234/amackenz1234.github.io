import SwiftUI

struct MainTabView: View {
  @Environment(ShopStore.self) private var store

  var body: some View {
    TabView {
      ShopHomeView()
        .tabItem {
          Label("Shop", systemImage: "bicycle")
        }

      ContactView()
        .tabItem {
          Label("Contact", systemImage: "phone.fill")
        }
    }
    .tint(ECTheme.red)
    .preferredColorScheme(.dark)
  }
}

#Preview {
  MainTabView()
    .environment(ShopStore())
}
