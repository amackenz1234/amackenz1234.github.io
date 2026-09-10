import SwiftUI

struct ProductDetailView: View {
  let product: Product
  @State private var showActions = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        ProductImageView(url: product.imageURL, height: 320)
          .overlay(alignment: .bottom) {
            LinearGradient(
              colors: [.clear, FaradayTheme.ink.opacity(0.55)],
              startPoint: .top,
              endPoint: .bottom
            )
            .frame(height: 80)
          }

        VStack(alignment: .leading, spacing: 14) {
          Text(product.sku)
            .font(.caption.weight(.semibold))
            .tracking(0.8)
            .textCase(.uppercase)
            .foregroundStyle(FaradayTheme.muted)

          Text(product.name)
            .font(.title.weight(.bold))
            .foregroundStyle(FaradayTheme.paper)

          HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text(product.formattedPrice)
              .font(.title2.weight(.heavy))
              .foregroundStyle(FaradayTheme.paper)
            Text(product.isInStock ? "In stock" : "Special order")
              .font(.subheadline.weight(.semibold))
              .foregroundStyle(product.isInStock ? FaradayTheme.muted : FaradayTheme.redBright)
          }

          Text(product.descriptionText)
            .font(.body)
            .foregroundStyle(FaradayTheme.muted)
            .padding(.top, 4)

          VStack(spacing: 10) {
            if let mailURL = mailtoURL {
              Link(destination: mailURL) {
                Text("Ask about this")
                  .font(.subheadline.weight(.heavy))
                  .foregroundStyle(.white)
                  .frame(maxWidth: .infinity)
                  .padding(.vertical, 14)
                  .background(FaradayTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
              }
            }

            Link(destination: URL(string: "tel:\(Catalog.phone)")!) {
              Label("Call \(Catalog.phoneDisplay)", systemImage: "phone.fill")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(FaradayTheme.paper)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .overlay(
                  RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(FaradayTheme.line, lineWidth: 1)
                )
            }
          }
          .padding(.top, 8)
          .opacity(showActions ? 1 : 0)
          .offset(y: showActions ? 0 : 12)
        }
        .padding(20)
      }
    }
    .background(FaradayTheme.ink.ignoresSafeArea())
    .navigationTitle(product.name)
    .navigationBarTitleDisplayMode(.inline)
    .toolbar {
      ToolbarItem(placement: .topBarTrailing) {
        ShareLink(item: shareText) {
          Image(systemName: "square.and.arrow.up")
            .foregroundStyle(FaradayTheme.paper)
        }
      }
    }
    .onAppear {
      withAnimation(.easeOut(duration: 0.4).delay(0.1)) {
        showActions = true
      }
    }
  }

  private var shareText: String {
    """
    \(product.name) — \(product.formattedPrice)
    Faraday · \(Catalog.phoneDisplay)
    \(Catalog.email)
    """
  }

  private var mailtoURL: URL? {
    var components = URLComponents()
    components.scheme = "mailto"
    components.path = Catalog.email
    components.queryItems = [
      URLQueryItem(name: "subject", value: "Inquiry: \(product.name) (\(product.sku))")
    ]
    return components.url
  }
}
