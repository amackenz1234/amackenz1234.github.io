import SwiftUI

struct ShopHomeView: View {
  @Environment(ShopStore.self) private var store
  @State private var appeared = false

  var body: some View {
    @Bindable var store = store

    NavigationStack(path: $store.path) {
      ScrollView {
        VStack(alignment: .leading, spacing: 0) {
          hero
          inventory
        }
      }
      .background(shopBackground.ignoresSafeArea())
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          BrandMark()
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
      .navigationDestination(for: Product.self) { product in
        ProductDetailView(product: product)
      }
      .onAppear {
        withAnimation(.easeOut(duration: 0.55)) {
          appeared = true
        }
      }
    }
  }

  private var shopBackground: some View {
    LinearGradient(
      colors: [
        ECTheme.ink,
        Color(red: 0.07, green: 0.07, blue: 0.09),
        ECTheme.ink,
      ],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  private var hero: some View {
    ZStack(alignment: .bottomLeading) {
      Group {
        if let featured = store.featuredProduct {
          ProductImageView(url: featured.imageURL, height: 360)
            .overlay(
              LinearGradient(
                colors: [
                  .clear,
                  ECTheme.ink.opacity(0.35),
                  ECTheme.ink.opacity(0.92),
                ],
                startPoint: .top,
                endPoint: .bottom
              )
            )
        } else {
          Rectangle()
            .fill(ECTheme.panel)
            .frame(height: 360)
        }
      }
      .scaleEffect(appeared ? 1 : 1.04)
      .opacity(appeared ? 1 : 0.7)

      VStack(alignment: .leading, spacing: 12) {
        Text("ELECTRO CYCLES")
          .font(.system(.caption, design: .rounded).weight(.heavy))
          .tracking(2.2)
          .foregroundStyle(ECTheme.paper)

        Text("Ride farther.")
          .font(.system(size: 42, weight: .bold, design: .default))
          .foregroundStyle(ECTheme.paper)
          .lineLimit(2)
          .minimumScaleFactor(0.8)

        Text("Ontario Evoque dealer · \(store.inStockCount) in stock")
          .font(.subheadline)
          .foregroundStyle(ECTheme.muted)
      }
      .padding(.horizontal, 20)
      .padding(.bottom, 28)
      .opacity(appeared ? 1 : 0)
      .offset(y: appeared ? 0 : 16)
    }
  }

  private var inventory: some View {
    @Bindable var store = store
    return VStack(alignment: .leading, spacing: 16) {
      Text("Shop inventory")
        .font(.title2.weight(.bold))
        .foregroundStyle(ECTheme.paper)

      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 8) {
          ForEach(store.categories, id: \.self) { category in
            Button {
              withAnimation(.snappy(duration: 0.25)) {
                store.category = category
              }
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

      TextField("Search bikes, scooters, gear", text: $store.query)
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
          .padding(.vertical, 20)
          .frame(maxWidth: .infinity)
      } else {
        LazyVGrid(
          columns: [GridItem(.adaptive(minimum: 160), spacing: 14)],
          spacing: 14
        ) {
          ForEach(store.filteredProducts) { product in
            NavigationLink(value: product) {
              ProductCard(product: product)
            }
            .buttonStyle(.plain)
          }
        }
      }
    }
    .padding(.horizontal, 20)
    .padding(.top, 24)
    .padding(.bottom, 36)
  }
}

struct BrandMark: View {
  var body: some View {
    HStack(spacing: 0) {
      Text("ELECTRO ")
        .foregroundStyle(ECTheme.paper)
      Text("CYCLES")
        .foregroundStyle(ECTheme.redBright)
    }
    .font(.system(.subheadline, design: .default).weight(.heavy))
    .tracking(1.2)
  }
}
