import SwiftUI

struct ProductCard: View {
  let product: Product

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ProductImageView(url: product.imageURL, height: 130)
        .overlay(alignment: .topTrailing) {
          if !product.isInStock {
            Text("ORDER")
              .font(.caption2.weight(.heavy))
              .tracking(0.6)
              .foregroundStyle(.white)
              .padding(.horizontal, 8)
              .padding(.vertical, 4)
              .background(FaradayTheme.red.opacity(0.92), in: Capsule())
              .padding(8)
          }
        }

      VStack(alignment: .leading, spacing: 6) {
        Text(product.category)
          .font(.caption2.weight(.semibold))
          .tracking(0.8)
          .textCase(.uppercase)
          .foregroundStyle(FaradayTheme.muted)
        Text(product.name)
          .font(.subheadline.weight(.semibold))
          .foregroundStyle(FaradayTheme.paper)
          .lineLimit(2)
          .multilineTextAlignment(.leading)
        Text(product.formattedPrice)
          .font(.subheadline.weight(.heavy))
          .foregroundStyle(FaradayTheme.paper)
      }
      .padding(12)
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .background(FaradayTheme.panel, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(FaradayTheme.line, lineWidth: 1)
    )
  }
}
