import SwiftUI

struct ContactSection: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Visit or call")
        .font(.title2.weight(.bold))
        .foregroundStyle(ECTheme.paper)

      Text("\(Catalog.phoneDisplay) · \(Catalog.email) · Ontario")
        .font(.body)
        .foregroundStyle(ECTheme.muted)

      HStack(spacing: 10) {
        Link(destination: URL(string: "tel:\(Catalog.phone)")!) {
          Label("Call", systemImage: "phone.fill")
            .font(.subheadline.weight(.heavy))
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(ECTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }

        Link(destination: URL(string: "mailto:\(Catalog.email)")!) {
          Text("Email the shop")
            .font(.subheadline.weight(.bold))
            .foregroundStyle(ECTheme.paper)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .overlay(
              RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(ECTheme.line, lineWidth: 1)
            )
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 20)
    .padding(.vertical, 28)
  }
}

struct FooterSection: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Electro Cycles · CAD")
      Text("GST/HST \(Catalog.gst)")
    }
    .font(.footnote)
    .foregroundStyle(ECTheme.muted)
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 20)
    .padding(.top, 8)
    .padding(.bottom, 36)
    .overlay(alignment: .top) {
      Rectangle()
        .fill(ECTheme.line)
        .frame(height: 1)
    }
  }
}
