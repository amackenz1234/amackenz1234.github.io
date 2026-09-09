import SwiftUI

struct ProductDetailView: View {
  @Environment(\.dismiss) private var dismiss
  let product: Product

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        ZStack {
          ECTheme.ink
          if let url = product.imageURL {
            AsyncImage(url: url) { phase in
              switch phase {
              case .success(let image):
                image
                  .resizable()
                  .scaledToFill()
              case .failure:
                Image(systemName: "bicycle")
                  .font(.system(size: 48))
                  .foregroundStyle(ECTheme.muted)
              case .empty:
                ProgressView().tint(ECTheme.muted)
              @unknown default:
                EmptyView()
              }
            }
          } else {
            Image(systemName: "bicycle")
              .font(.system(size: 48))
              .foregroundStyle(ECTheme.muted)
          }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 240)
        .clipped()

        VStack(alignment: .leading, spacing: 12) {
          Text(product.sku)
            .font(.caption.weight(.semibold))
            .tracking(0.8)
            .textCase(.uppercase)
            .foregroundStyle(ECTheme.muted)

          Text(product.name)
            .font(.title2.weight(.bold))
            .foregroundStyle(ECTheme.paper)

          Text(product.formattedPrice)
            .font(.title3.weight(.heavy))
            .foregroundStyle(ECTheme.paper)

          if !product.isInStock {
            Text("Special order")
              .font(.subheadline)
              .foregroundStyle(ECTheme.redBright)
          }

          Text(product.descriptionText)
            .font(.body)
            .foregroundStyle(ECTheme.muted)

          HStack(spacing: 10) {
            if let mailURL = mailtoURL {
              Link(destination: mailURL) {
                Text("Ask about this")
                  .font(.subheadline.weight(.heavy))
                  .foregroundStyle(.white)
                  .frame(maxWidth: .infinity)
                  .padding(.vertical, 12)
                  .background(ECTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
              }
            }

            Button("Close") { dismiss() }
              .font(.subheadline.weight(.bold))
              .foregroundStyle(ECTheme.paper)
              .padding(.horizontal, 16)
              .padding(.vertical, 12)
              .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                  .stroke(ECTheme.line, lineWidth: 1)
              )
          }
          .padding(.top, 8)
        }
        .padding(16)
      }
    }
    .background(ECTheme.panel.ignoresSafeArea())
  }

  private var mailtoURL: URL? {
    var components = URLComponents()
    components.scheme = "mailto"
    components.path = Catalog.email
    components.queryItems = [
      URLQueryItem(name: "subject", value: product.name)
    ]
    return components.url
  }
}
