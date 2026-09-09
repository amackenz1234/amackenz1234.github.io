import SwiftUI

struct HeroSection: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      Text("Ontario · Evoque dealer")
        .font(.caption.weight(.semibold))
        .tracking(1.0)
        .textCase(.uppercase)
        .foregroundStyle(ECTheme.muted)

      Text("Ride farther.")
        .font(.system(size: 44, weight: .bold, design: .default))
        .foregroundStyle(ECTheme.paper)
        .lineLimit(2)
        .minimumScaleFactor(0.8)

      Text("E-bikes, scooters, mobility, and gear. Custom shop for Electro Cycles.")
        .font(.body)
        .foregroundStyle(ECTheme.muted)
        .frame(maxWidth: 340, alignment: .leading)

      Link(destination: URL(string: "tel:\(Catalog.phone)")!) {
        Text("Call the shop")
          .font(.subheadline.weight(.heavy))
          .foregroundStyle(.white)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .background(ECTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
      }
      .padding(.top, 4)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 20)
    .padding(.top, 28)
    .padding(.bottom, 20)
  }
}
