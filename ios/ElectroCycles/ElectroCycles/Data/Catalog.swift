import Foundation

enum Catalog {
  static let products: [Product] = [
    Product(
      sku: "EC-BANDIT",
      name: "Evoque Bandit",
      category: "E-Bikes",
      price: 5499.0,
      quantity: 10,
      descriptionText: "Official Evoque Bandit dirt bike. 4kW continuous / 8kW peak. 380 Nm. Rated 85 km/h achievable 100 km/h. 72V 40Ah LG. Range 120 km. Weight 72 kg. Load 120 kg. KKE suspension. Source ebikes.evoqueca.com",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1_de411226-e590-42f7-97a7-18bac826e457.jpg")
    ),
    Product(
      sku: "STG25001",
      name: "Evoque Stinger Plus",
      category: "E-Scooters",
      price: 4449.0,
      quantity: 10,
      descriptionText: "Official Stinger Plus. 500W. 72V 50Ah removable lithium. Range 100-110 km. Weight 152 lb. Load 180 kg. Hydraulic discs. Optional rear seat box or rack.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/2_66e9ddb6-d2eb-47c5-acdd-95294b5e9e96.png")
    ),
    Product(
      sku: "EZN25001",
      name: "Evoque Enza Enclosed Mobility Scooter",
      category: "Mobility",
      price: 9889.0,
      quantity: 10,
      descriptionText: "Official Enza enclosed scooter. 2200W. 60V 80Ah. Range 80-90 km. Cabin A/C. Apple CarPlay. Push start. Load 280 kg. Weight 240 kg.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/2_d6dab7cd-ba99-4a75-afaa-f8cfe1c4a1b2.png")
    ),
    Product(
      sku: "SRR25001",
      name: "Evoque Streetster RR",
      category: "E-Bikes",
      price: 8599.0,
      quantity: 10,
      descriptionText: "Official Streetster RR. 96V 80Ah 150A controller. Range 180-200 km. Weight about 148 kg. Factory list from 10899.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/3_68bb35e0-5320-4165-9ad7-27ef37b1d484.png")
    ),
    Product(
      sku: "VLR24001",
      name: "Evoque Valor",
      category: "E-Scooters",
      price: 3399.0,
      quantity: 10,
      descriptionText: "Official Valor scooter-style e-bike. Factory range 2499-3548. Rugged 60V platform.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/5_0f0cf82f-f137-40ee-a540-93efb74f7130.png")
    ),
    Product(
      sku: "ETR24001",
      name: "Evoque Etron Plus",
      category: "E-Bikes",
      price: 2899.0,
      quantity: 10,
      descriptionText: "Official Etron Plus motorcycle-style e-bike. Factory range 2899-5599. Removable battery. Hydraulic discs.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/7_5a1ccf1f-6cd6-4b46-93db-ece7fdf415a9.png")
    ),
    Product(
      sku: "ATM24001",
      name: "Evoque Atom",
      category: "E-Scooters",
      price: 3299.0,
      quantity: 10,
      descriptionText: "Official Atom. 500W. 60V 26Ah removable lithium. Range 75 km. Weight 126 lb. Load 280 kg.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1_e3133310-9178-450b-bbe7-34143389ed1d.png")
    ),
    Product(
      sku: "ATM25001",
      name: "Evoque Atom V2",
      category: "E-Scooters",
      price: 3699.0,
      quantity: 10,
      descriptionText: "Official Atom v2 72V. 35Ah lead-acid 60-70 km or 30Ah lithium 80-90 km. Factory range 2699-3849.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1_d9c77ed3-6dd2-4b91-a92f-010c06b89817.png")
    ),
    Product(
      sku: "EC-COVER",
      name: "Bike Cover Waterproof",
      category: "Accessories",
      price: 32.99,
      quantity: 25,
      descriptionText: "210D oxford outdoor bike cover. Fits one 29 in bike or two 26 in bikes.",
      imageURL: nil
    ),
    Product(
      sku: "EC-CHAIN",
      name: "NY Fahgettaboudit Chain 1410",
      category: "Accessories",
      price: 309.99,
      quantity: 25,
      descriptionText: "Hardened 14mm six-sided chain. 1410 PSI. 100 cm. Security 10/10.",
      imageURL: nil
    ),
    Product(
      sku: "EC-HELMET",
      name: "Moto Helmet",
      category: "Accessories",
      price: 249.99,
      quantity: 25,
      descriptionText: "Dual visor modular helmet. FMVSS-218 and DOT.",
      imageURL: nil
    ),
    Product(
      sku: "EVQ-STREETSTER-R",
      name: "Evoque Streetster R",
      category: "E-Bikes",
      price: 3999.0,
      quantity: 0,
      descriptionText: "Official Streetster R street-legal PAB. 500W continuous capped 32 km/h. Removable batteries up to 84V 60Ah (120-140 km). Apple CarPlay. Factory 3999-7599. Source ebikes.evoqueca.com/products/evoque-streetster-r-motorcycle-style-e-bike",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/2_74a74223-0322-464d-b835-12325bedc6a2.png")
    ),
    Product(
      sku: "EVQ-LEGACY",
      name: "Evoque Legacy",
      category: "E-Bikes",
      price: 3099.0,
      quantity: 0,
      descriptionText: "Official Legacy cafe racer. 72V 20Ah lead-acid 40-50 km or 72V 30Ah lithium 70-80 km. Load 280 kg. Weight about 110 kg. Dual disc front. Factory 3099-4199.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/Evoque_Legacy.png")
    ),
    Product(
      sku: "EVQ-RAIDER",
      name: "Evoque Raider",
      category: "E-Bikes",
      price: 5999.0,
      quantity: 0,
      descriptionText: "Official Raider dirt bike. Peak 15 kW. Range 120 km. Factory 5999. Source Evoque Canada compare chart.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/DSC06191_140b5030-0333-4b73-bfe1-d21747d82f32.jpg")
    ),
    Product(
      sku: "EVQ-OUTLAW",
      name: "Evoque Outlaw",
      category: "E-Bikes",
      price: 8599.0,
      quantity: 0,
      descriptionText: "Official Outlaw flagship dirt bike. Peak 25 kW. Range 140 km. Factory 8599. Source Evoque Canada compare chart.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1778738090913427517959819264.webp")
    ),
    Product(
      sku: "EVQ-STINGER",
      name: "Evoque Stinger",
      category: "E-Scooters",
      price: 3449.0,
      quantity: 0,
      descriptionText: "Official Stinger scooter. 72V 30Ah lithium. Range 85 km. Weight 152 lb. Load 180 kg. Top speed listed 32 mph. Optional 18L front box.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/3_8827c562-82be-4633-adc8-943a701d5b20.png")
    ),
    Product(
      sku: "EVQ-GEM",
      name: "Evoque Gem",
      category: "E-Scooters",
      price: 2199.0,
      quantity: 0,
      descriptionText: "Official Gem scooter-style e-bike. Factory 2199-2329. Source Evoque Canada homepage.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/13_bbcda386-6d3d-4d2a-b0e6-5d2ba74d18a8.png")
    ),
    Product(
      sku: "EVQ-TACTICAL",
      name: "Evoque Tactical",
      category: "E-Scooters",
      price: 3199.0,
      quantity: 0,
      descriptionText: "Official Tactical scooter-style e-bike. Factory 3199-4949. Source Evoque Canada homepage.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/2_4eaa64db-69d3-46a2-bf78-f639904a969d.png")
    ),
    Product(
      sku: "ALT-SIGMA",
      name: "Altis Sigma",
      category: "E-Bikes",
      price: 7500.0,
      quantity: 0,
      descriptionText: "Altis Sigma sold via Evoque Canada. 25 kW peak (34 HP) hairpin motor. 601 Nm. 97.2V 35Ah Samsung. Top speed listed 128 km/h.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1778738090913427517959819264.webp")
    ),
    Product(
      sku: "ALT-DELTA",
      name: "Altis Delta",
      category: "E-Bikes",
      price: 4900.0,
      quantity: 0,
      descriptionText: "Altis Delta listed on Evoque Canada. Factory 4900. Shown sold out on collection page.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/1_f17facfa-e732-4896-ac43-1f3fef1b9daa.jpg")
    ),
    Product(
      sku: "ALT-DELTA-S",
      name: "Altis Delta S",
      category: "E-Bikes",
      price: 4399.0,
      quantity: 0,
      descriptionText: "Altis Delta S listed on Evoque Canada. Factory 4399. Shown sold out on collection page.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/ChatGPT_Image_2026_5_22_22_30_33.png")
    ),
    Product(
      sku: "ALT-OMEGA",
      name: "Altis Omega",
      category: "E-Bikes",
      price: 11000.0,
      quantity: 0,
      descriptionText: "Altis Omega listed on Evoque Canada. 55 kW / 74 HP class. Factory 11000-14999.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/4715741adcf8b608cd84a3ce60eb44d_1.jpg")
    ),
    Product(
      sku: "AVA-GLIDE",
      name: "Avantis Glide 3-Wheel Mobility",
      category: "Mobility",
      price: 2199.0,
      quantity: 0,
      descriptionText: "Avantis Glide 3-wheel mobility scooter on Evoque Canada. Sale from 3299 to 2199.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/IMG_4456_d5c7ca58-039a-4a8d-8bca-b72a70e0e97d.png")
    ),
    Product(
      sku: "AVA-HORIZON",
      name: "Avantis Horizon 4-Wheel Mobility",
      category: "Mobility",
      price: 2990.0,
      quantity: 0,
      descriptionText: "Avantis Horizon 4-wheel. Top speed 11-20 km/h. Range 40-60 km. Load 155 kg. 48V 20Ah. Sale from 3599 to 2990.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/DSC06697.png")
    ),
    Product(
      sku: "AVA-TRAVELLER",
      name: "Avantis Traveller 4-Wheel Mobility",
      category: "Mobility",
      price: 3499.0,
      quantity: 0,
      descriptionText: "Avantis Traveller heavy-duty 4-wheel. Top speed 25 km/h. Range 55-65 km. Load 150 kg. 60V 20Ah. Full suspension.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/DSC06570.png")
    ),
    Product(
      sku: "EVQ-HELMET",
      name: "Evoque Ebike Helmet",
      category: "Accessories",
      price: 120.0,
      quantity: 0,
      descriptionText: "Official Evoque Canada ebike helmet. Factory 120.",
      imageURL: URL(string: "https://ebikes.evoqueca.com/cdn/shop/files/WechatIMG174.jpg")
    ),
  ]

  static let phone = "9053085392"
  static let phoneDisplay = "905-308-5392"
  static let email = "info@electrocycles.ca"
  static let gst = "729028506TZ0001"
}
