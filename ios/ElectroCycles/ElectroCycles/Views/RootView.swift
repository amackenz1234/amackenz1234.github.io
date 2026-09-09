import SwiftUI

struct RootView: View {
  @Environment(ShopStore.self) private var store

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 0) {
          HeroSection()
          ShopSection()
          ContactSection()
          FooterSection()
        }
      }
      .background(ECTheme.ink.ignoresSafeArea())
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          HStack(spacing: 0) {
            Text("ELECTRO ")
              .foregroundStyle(ECTheme.paper)
            Text("CYCLES")
              .foregroundStyle(ECTheme.redBright)
          }
          .font(.system(.subheadline, design: .default).weight(.heavy))
          .tracking(1.2)
        }
        ToolbarItem(placement: .topBarTrailing) {
          Link(destination: URL(string: "tel:\(Catalog.phone)")!) {
            Text("Call")
              .font(.subheadline.weight(.heavy))
              .foregroundStyle(.white)
              .padding(.horizontal, 14)
              .padding(.vertical, 8)
              .background(ECTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
          }
        }
      }
      .toolbarBackground(ECTheme.ink.opacity(0.94), for: .navigationBar)
      .toolbarBackground(.visible, for: .navigationBar)
      .sheet(item: Bindable(store).selectedProduct) { product in
        ProductDetailView(product: product)
          .presentationDetents([.medium, .large])
          .presentationDragIndicator(.visible)
      }
    }
    .tint(ECTheme.red)
  }
}

#Preview {
  RootView()
    .environment(ShopStore())
}
