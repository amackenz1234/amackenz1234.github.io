import SwiftUI

struct ProductCard: View {
  let product: Product
  let onTap: () -> Void

  var body: some View {
    Button(action: onTap) {
      VStack(alignment: .leading, spacing: 0) {
        ZStack {
          Color.black.opacity(0.55)
          if let url = product.imageURL {
            AsyncImage(url: url) { phase in
              switch phase {
              case .success(let image):
                image
                  .resizable()
                  .scaledToFill()
              case .failure:
                placeholder
              case .empty:
                ProgressView()
                  .tint(ECTheme.muted)
              @unknown default:
                placeholder
              }
            }
          } else {
            placeholder
          }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 130)
        .clipped()

        VStack(alignment: .leading, spacing: 6) {
          Text(product.category)
            .font(.caption2.weight(.semibold))
            .tracking(0.8)
            .textCase(.uppercase)
            .foregroundStyle(ECTheme.muted)
          Text(product.name)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(ECTheme.paper)
            .lineLimit(2)
            .multilineTextAlignment(.leading)
          Text(product.formattedPrice)
            .font(.subheadline.weight(.heavy))
            .foregroundStyle(ECTheme.paper)
          if !product.isInStock {
            Text("Special order")
              .font(.caption)
              .foregroundStyle(ECTheme.redBright)
          }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .background(ECTheme.panel, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .stroke(ECTheme.line, lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
  }

  private var placeholder: some View {
    Image(systemName: "bicycle")
      .font(.largeTitle)
      .foregroundStyle(ECTheme.muted)
  }
}
