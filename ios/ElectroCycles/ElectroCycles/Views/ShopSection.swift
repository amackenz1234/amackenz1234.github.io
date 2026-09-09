import SwiftUI

struct ShopSection: View {
  @Environment(ShopStore.self) private var store

  var body: some View {
    @Bindable var store = store

    VStack(alignment: .leading, spacing: 16) {
      Text("Shop inventory")
        .font(.title2.weight(.bold))
        .foregroundStyle(ECTheme.paper)

      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 8) {
          ForEach(store.categories, id: \.self) { category in
            Button {
              store.category = category
            } label: {
              Text(category)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(ECTheme.paper)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                  store.category == category ? ECTheme.red : Color(red: 0.110, green: 0.110, blue: 0.133),
                  in: Capsule()
                )
                .overlay(
                  Capsule()
                    .stroke(store.category == category ? ECTheme.red : ECTheme.line, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
          }
        }
      }

      TextField("Search", text: $store.query)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()
        .padding(12)
        .foregroundStyle(ECTheme.paper)
        .background(ECTheme.panel, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(ECTheme.line, lineWidth: 1)
        )

      if store.filteredProducts.isEmpty {
        Text("No matches.")
          .foregroundStyle(ECTheme.muted)
          .padding(.vertical, 12)
      } else {
        LazyVGrid(
          columns: [GridItem(.adaptive(minimum: 160), spacing: 14)],
          spacing: 14
        ) {
          ForEach(store.filteredProducts) { product in
            ProductCard(product: product) {
              store.selectedProduct = product
            }
          }
        }
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 24)
  }
}
