import SwiftUI

struct ProductImageView: View {
  let url: URL?
  var height: CGFloat? = nil
  var contentMode: ContentMode = .fill

  var body: some View {
    ZStack {
      FaradayTheme.ink
      if let url {
        AsyncImage(url: url) { phase in
          switch phase {
          case .success(let image):
            image
              .resizable()
              .aspectRatio(contentMode: contentMode)
          case .failure:
            placeholder
          case .empty:
            ProgressView()
              .tint(FaradayTheme.muted)
          @unknown default:
            placeholder
          }
        }
      } else {
        placeholder
      }
    }
    .frame(maxWidth: .infinity)
    .frame(height: height)
    .clipped()
  }

  private var placeholder: some View {
    Image(systemName: "bicycle")
      .font(.system(size: 40, weight: .light))
      .foregroundStyle(FaradayTheme.muted)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}
