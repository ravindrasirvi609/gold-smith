/**
 * seed-demo-data.mjs
 *
 * Clears all transactional data and loads a realistic demo dataset so the
 * application can be shown end-to-end without manual data entry.
 *
 * Run AFTER the access-control and reference-data seeds:
 *   npm run seed:access-control
 *   npm run seed:admin-user
 *   npm run seed:reference-data
 *   npm run seed:demo
 *
 * Safe to re-run — drops all transactional collections before inserting.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "gold-smith";
const SEED_DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}
if (!SEED_DEMO_PASSWORD) {
  console.error("SEED_DEMO_PASSWORD is not set. Add it to .env before seeding.");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function oid() {
  return new ObjectId();
}

function d(iso) {
  return new Date(iso);
}

function pad(n, width = 4) {
  return String(n).padStart(width, "0");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  // ── 1. Clear transactional collections + sequences ───────────────────────
  const transactional = [
    "vendors", "customers", "karigars",
    "goldPurchases", "diamondPurchases",
    "karigarIssues", "karigarReceipts",
    "products",
    "approvals", "invoices", "payments",
    "sequences",
  ];
  // Keep only the admin user (seeded separately); clear others
  for (const col of transactional) {
    await db.collection(col).deleteMany({});
  }
  // Delete non-admin users (keep email from SEED_ADMIN_EMAIL)
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "").toLowerCase();
  if (adminEmail) {
    await db.collection("users").deleteMany({ email: { $ne: adminEmail } });
  } else {
    await db.collection("users").deleteMany({});
  }
  console.log("✓ Cleared transactional collections");

  // ── 2. Fetch reference IDs ────────────────────────────────────────────────
  const superAdminRole = await db.collection("roles").findOne({ name: "Super Admin" });
  if (!superAdminRole) {
    console.error('Role "Super Admin" not found. Run seed:access-control first.');
    process.exit(1);
  }
  const superAdminRoleId = superAdminRole._id;

  // ── 3. Extra users ────────────────────────────────────────────────────────
  const pwHash = bcrypt.hashSync(SEED_DEMO_PASSWORD, 12);

  const userId_manager = oid();
  const userId_sales = oid();

  await db.collection("users").insertMany([
    {
      _id: userId_manager,
      firstName: "Rajesh",
      lastName: "Sharma",
      email: "manager@goldsmith.demo",
      mobile: "9876500001",
      password: pwHash,
      role: superAdminRoleId,
      profileImage: null,
      status: "ACTIVE",
      createdBy: null,
      createdAt: d("2025-08-01"),
    },
    {
      _id: userId_sales,
      firstName: "Priya",
      lastName: "Mehta",
      email: "sales@goldsmith.demo",
      mobile: "9876500002",
      password: pwHash,
      role: superAdminRoleId,
      profileImage: null,
      status: "ACTIVE",
      createdBy: null,
      createdAt: d("2025-08-01"),
    },
  ]);
  console.log("✓ Created demo users");

  // ── 4. Vendors ────────────────────────────────────────────────────────────
  const vendorId1 = oid();
  const vendorId2 = oid();
  const vendorId3 = oid();

  await db.collection("vendors").insertMany([
    {
      _id: vendorId1,
      vendorCode: "V0001",
      vendorType: "GOLD",
      businessType: "PARTNERSHIP",
      companyName: "Shivam Gold Traders",
      ownerName: "Shivkumar Agarwal",
      mobile: "9823001001",
      alternateMobile: "",
      email: "shivam.gold@gmail.com",
      gstNumber: "27AAACS5249A1ZW",
      panNumber: "AAACS5249A",
      address: "Zaveri Bazaar, 14-C Patel Lane",
      city: "Mumbai",
      state: "MH",
      pincode: "400002",
      country: "IN",
      paymentTerms: "NET_30",
      creditDays: "30",
      creditLimit: "5000000",
      openingBalance: "0",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
      accountNumber: "50200012345678",
      status: "ACTIVE",
      logoUrl: null,
      gstDocUrl: null,
      panDocUrl: null,
      remarks: "Primary gold supplier — 916 & 999 purity.",
      createdAt: d("2025-07-01"),
      updatedAt: d("2025-07-01"),
    },
    {
      _id: vendorId2,
      vendorCode: "V0002",
      vendorType: "GOLD",
      businessType: "PROPRIETORSHIP",
      companyName: "Mahavir Bullion",
      ownerName: "Mahavir Patel",
      mobile: "9879002002",
      alternateMobile: "",
      email: "mahavir.bullion@gmail.com",
      gstNumber: "24AABCM3121B1ZX",
      panNumber: "AABCM3121B",
      address: "Bullion Market, Plot 7, Kalupur",
      city: "Ahmedabad",
      state: "GJ",
      pincode: "380002",
      country: "IN",
      paymentTerms: "IMMEDIATE",
      creditDays: "0",
      creditLimit: "2000000",
      openingBalance: "0",
      bankName: "Bank of Baroda",
      ifscCode: "BARB0KALUPA",
      accountNumber: "20230100022143",
      status: "ACTIVE",
      logoUrl: null,
      gstDocUrl: null,
      panDocUrl: null,
      remarks: "750 & 585 purity specialist.",
      createdAt: d("2025-07-05"),
      updatedAt: d("2025-07-05"),
    },
    {
      _id: vendorId3,
      vendorCode: "V0003",
      vendorType: "DIAMOND",
      businessType: "PVT_LTD",
      companyName: "Diamond House Pvt Ltd",
      ownerName: "Harish Kothari",
      mobile: "9871003003",
      alternateMobile: "9871003004",
      email: "info@diamondhouse.in",
      gstNumber: "24AACCD1234C1ZY",
      panNumber: "AACCD1234C",
      address: "Surat Diamond Bourse, Block B-12",
      city: "Surat",
      state: "GJ",
      pincode: "395010",
      country: "IN",
      paymentTerms: "NET_15",
      creditDays: "15",
      creditLimit: "1000000",
      openingBalance: "0",
      bankName: "Axis Bank",
      ifscCode: "UTIB0001098",
      accountNumber: "922010012345678",
      status: "ACTIVE",
      logoUrl: null,
      gstDocUrl: null,
      panDocUrl: null,
      remarks: "Natural rounds & fancy cuts. GIA certified stock.",
      createdAt: d("2025-07-10"),
      updatedAt: d("2025-07-10"),
    },
  ]);
  console.log("✓ Created 3 vendors");

  // ── 5. Customers ──────────────────────────────────────────────────────────
  const custId1 = oid(); // Anita Patel  (VIP)
  const custId2 = oid(); // Suresh Mehta (Premium)
  const custId3 = oid(); // Kavya Reddy  (Regular)
  const custId4 = oid(); // Rajesh Shah  (Regular)
  const custId5 = oid(); // Sunita Joshi (VIP)

  await db.collection("customers").insertMany([
    {
      _id: custId1,
      customerCode: "C0001",
      salutation: "Mrs.",
      firstName: "Anita",
      lastName: "Patel",
      gender: "FEMALE",
      dob: "1982-03-15",
      anniversary: "2005-11-20",
      maritalStatus: "MARRIED",
      customerTier: "VIP",
      mobile: "9824101001",
      alternateMobile: "9824101002",
      email: "anita.patel@gmail.com",
      preferredContactChannel: "WHATSAPP",
      address: "12, Satellite Heights, Nr. Judges Bunglow Rd",
      city: "Ahmedabad",
      state: "GJ",
      pincode: "380015",
      country: "IN",
      gstNumber: "",
      panNumber: "AJNPP1234Q",
      status: "ACTIVE",
      photoUrl: null,
      idProofUrl: null,
      remarks: "Prefers 22k. Repeat buyer for gifting season.",
      createdAt: d("2025-08-10"),
      updatedAt: d("2025-08-10"),
    },
    {
      _id: custId2,
      customerCode: "C0002",
      salutation: "Mr.",
      firstName: "Suresh",
      lastName: "Mehta",
      gender: "MALE",
      dob: "1975-07-22",
      anniversary: "2001-06-15",
      maritalStatus: "MARRIED",
      customerTier: "PREMIUM",
      mobile: "9712202002",
      alternateMobile: "",
      email: "suresh.mehta@outlook.com",
      preferredContactChannel: "EMAIL",
      address: "A-4, Diamond Residency, Ring Road",
      city: "Surat",
      state: "GJ",
      pincode: "395002",
      country: "IN",
      gstNumber: "",
      panNumber: "BCCPM7890R",
      status: "ACTIVE",
      photoUrl: null,
      idProofUrl: null,
      remarks: "Buys diamond sets for business gifts.",
      createdAt: d("2025-08-15"),
      updatedAt: d("2025-08-15"),
    },
    {
      _id: custId3,
      customerCode: "C0003",
      salutation: "Miss",
      firstName: "Kavya",
      lastName: "Reddy",
      gender: "FEMALE",
      dob: "1998-01-30",
      anniversary: null,
      maritalStatus: "SINGLE",
      customerTier: "REGULAR",
      mobile: "9703303003",
      alternateMobile: "",
      email: "kavya.reddy@gmail.com",
      preferredContactChannel: "CALL",
      address: "Flat 3B, Silicon Heights, HITECH City",
      city: "Hyderabad",
      state: "TS",
      pincode: "500081",
      country: "IN",
      gstNumber: "",
      panNumber: "",
      status: "ACTIVE",
      photoUrl: null,
      idProofUrl: null,
      remarks: "",
      createdAt: d("2025-09-01"),
      updatedAt: d("2025-09-01"),
    },
    {
      _id: custId4,
      customerCode: "C0004",
      salutation: "Mr.",
      firstName: "Rajesh",
      lastName: "Shah",
      gender: "MALE",
      dob: "1968-11-05",
      anniversary: "1995-04-22",
      maritalStatus: "MARRIED",
      customerTier: "REGULAR",
      mobile: "9820404004",
      alternateMobile: "9820404005",
      email: "rajesh.shah@hotmail.com",
      preferredContactChannel: "CALL",
      address: "302, Sunshine Apartments, Juhu",
      city: "Mumbai",
      state: "MH",
      pincode: "400049",
      country: "IN",
      gstNumber: "",
      panNumber: "DNFPS3456T",
      status: "ACTIVE",
      photoUrl: null,
      idProofUrl: null,
      remarks: "Celebrates wedding anniversary with gold purchase each year.",
      createdAt: d("2025-09-05"),
      updatedAt: d("2025-09-05"),
    },
    {
      _id: custId5,
      customerCode: "C0005",
      salutation: "Mrs.",
      firstName: "Sunita",
      lastName: "Joshi",
      gender: "FEMALE",
      dob: "1980-06-18",
      anniversary: "2003-12-10",
      maritalStatus: "MARRIED",
      customerTier: "VIP",
      mobile: "9822505005",
      alternateMobile: "",
      email: "sunita.joshi@gmail.com",
      preferredContactChannel: "WHATSAPP",
      address: "Villa 7, Baner Road, Baner",
      city: "Pune",
      state: "MH",
      pincode: "411045",
      country: "IN",
      gstNumber: "",
      panNumber: "HJKJS6789U",
      status: "ACTIVE",
      photoUrl: null,
      idProofUrl: null,
      remarks: "Loyal customer since 2019. Bridal sets specialist.",
      createdAt: d("2025-09-08"),
      updatedAt: d("2025-09-08"),
    },
  ]);
  console.log("✓ Created 5 customers");

  // ── 6. Karigars ───────────────────────────────────────────────────────────
  const karigarId1 = oid(); // Ramjibhai – Rings
  const karigarId2 = oid(); // Lalibhai  – Chains & necklaces
  const karigarId3 = oid(); // Prabhubhai – Earrings

  await db.collection("karigars").insertMany([
    {
      _id: karigarId1,
      karigarCode: "K0001",
      name: "Ramjibhai Soni",
      fatherName: "Manibhai Soni",
      gender: "MALE",
      mobile: "9725601001",
      alternateMobile: "",
      email: "",
      aadhaarNumber: "234512348901",
      panNumber: "EJKRS4321W",
      address: "Shop 12, Soni Bazaar",
      city: "Rajkot",
      state: "GJ",
      pincode: "360001",
      country: "IN",
      specialization: "RINGS",
      skillLevel: "SENIOR",
      labourBasis: "PER_GRAM",
      labourRate: "180",
      openingBalance: "0",
      creditBalance: "0",
      joiningDate: "2020-04-01",
      status: "ACTIVE",
      photoUrl: null,
      aadhaarDocUrl: null,
      panDocUrl: null,
      remarks: "Expert in solitaire & bridal rings.",
      createdAt: d("2025-07-15"),
      updatedAt: d("2025-07-15"),
    },
    {
      _id: karigarId2,
      karigarCode: "K0002",
      name: "Lalibhai Suthar",
      fatherName: "Natubhai Suthar",
      gender: "MALE",
      mobile: "9825602002",
      alternateMobile: "",
      email: "",
      aadhaarNumber: "567823459012",
      panNumber: "FKLSU7654V",
      address: "Near Ranchhodji Temple, Nadiad",
      city: "Nadiad",
      state: "GJ",
      pincode: "387001",
      country: "IN",
      specialization: "CHAINS",
      skillLevel: "INTERMEDIATE",
      labourBasis: "PER_GRAM",
      labourRate: "150",
      openingBalance: "0",
      creditBalance: "0",
      joiningDate: "2021-09-15",
      status: "ACTIVE",
      photoUrl: null,
      aadhaarDocUrl: null,
      panDocUrl: null,
      remarks: "Specialises in long chains and multi-layer necklaces.",
      createdAt: d("2025-07-20"),
      updatedAt: d("2025-07-20"),
    },
    {
      _id: karigarId3,
      karigarCode: "K0003",
      name: "Prabhubhai Rajput",
      fatherName: "Amrutbhai Rajput",
      gender: "MALE",
      mobile: "9727703003",
      alternateMobile: "",
      email: "",
      aadhaarNumber: "901234560123",
      panNumber: "GLMPR3210X",
      address: "Bazar Road, Morbi",
      city: "Morbi",
      state: "GJ",
      pincode: "363641",
      country: "IN",
      specialization: "EARRINGS",
      skillLevel: "JUNIOR",
      labourBasis: "PER_PIECE",
      labourRate: "400",
      openingBalance: "0",
      creditBalance: "0",
      joiningDate: "2023-06-01",
      status: "ACTIVE",
      photoUrl: null,
      aadhaarDocUrl: null,
      panDocUrl: null,
      remarks: "Fast learner. Good with jhumkas and chandelier styles.",
      createdAt: d("2025-08-01"),
      updatedAt: d("2025-08-01"),
    },
  ]);
  console.log("✓ Created 3 karigars");

  // ── 7. Gold Purchases ─────────────────────────────────────────────────────
  const gpId1 = oid();
  const gpId2 = oid();
  const gpId3 = oid();

  await db.collection("goldPurchases").insertMany([
    {
      _id: gpId1,
      purchaseNo: "GP0001",
      vendorId: vendorId1.toString(),
      vendorName: "Shivam Gold Traders",
      invoiceNo: "SGT-2025-0921",
      invoiceDate: "2025-09-15",
      purchaseDate: "2025-09-15",
      items: [
        { purity: "916", grossWeight: "350", pureWeight: "320.6", ratePerGram: "6850", amount: "2196110" },
        { purity: "999", grossWeight: "150", pureWeight: "149.85", ratePerGram: "7250", amount: "1086413" },
      ],
      gst: "126278",
      otherCharges: "500",
      total: "3409301",
      status: "COMPLETED",
      invoiceFileUrl: null,
      remarks: "Diwali stock purchase.",
      createdAt: d("2025-09-15"),
      updatedAt: d("2025-09-15"),
    },
    {
      _id: gpId2,
      purchaseNo: "GP0002",
      vendorId: vendorId2.toString(),
      vendorName: "Mahavir Bullion",
      invoiceNo: "MB-OCT-0042",
      invoiceDate: "2025-10-05",
      purchaseDate: "2025-10-05",
      items: [
        { purity: "750", grossWeight: "200", pureWeight: "150", ratePerGram: "5700", amount: "855000" },
      ],
      gst: "15390",
      otherCharges: "200",
      total: "870590",
      status: "COMPLETED",
      invoiceFileUrl: null,
      remarks: "18k batch for lightweight jewellery line.",
      createdAt: d("2025-10-05"),
      updatedAt: d("2025-10-05"),
    },
    {
      _id: gpId3,
      purchaseNo: "GP0003",
      vendorId: vendorId1.toString(),
      vendorName: "Shivam Gold Traders",
      invoiceNo: "",
      invoiceDate: "",
      purchaseDate: "2025-12-15",
      items: [
        { purity: "916", grossWeight: "300", pureWeight: "274.8", ratePerGram: "7100", amount: "1951080" },
      ],
      gst: "0",
      otherCharges: "0",
      total: "1951080",
      status: "DRAFT",
      invoiceFileUrl: null,
      remarks: "Wedding season stock — pending vendor invoice.",
      createdAt: d("2025-12-15"),
      updatedAt: d("2025-12-15"),
    },
  ]);
  console.log("✓ Created 3 gold purchases");

  // ── 8. Diamond Purchases ──────────────────────────────────────────────────
  const dpId1 = oid();

  await db.collection("diamondPurchases").insertMany([
    {
      _id: dpId1,
      purchaseNo: "DP0001",
      vendorId: vendorId3.toString(),
      vendorName: "Diamond House Pvt Ltd",
      invoiceNo: "DH-OCT-2025-0188",
      invoiceDate: "2025-10-10",
      purchaseDate: "2025-10-10",
      items: [
        { sieveSize: "+8", shape: "ROUND", color: "G", clarity: "VS1", pcs: "50", carat: "1.25", ratePerCarat: "45000", amount: "56250" },
        { sieveSize: "+10", shape: "ROUND", color: "H", clarity: "SI1", pcs: "30", carat: "0.90", ratePerCarat: "38000", amount: "34200" },
        { sieveSize: "FANCY_OVAL", shape: "OVAL", color: "F", clarity: "VVS2", pcs: "10", carat: "2.50", ratePerCarat: "95000", amount: "237500" },
      ],
      gst: "11873",
      otherCharges: "0",
      total: "339823",
      status: "COMPLETED",
      invoiceFileUrl: null,
      remarks: "GIA certified. Includes 10 fancy ovals for custom orders.",
      createdAt: d("2025-10-10"),
      updatedAt: d("2025-10-10"),
    },
  ]);
  console.log("✓ Created 1 diamond purchase");

  // ── 9. Karigar Issues ─────────────────────────────────────────────────────
  const issueId1 = oid(); // Ramjibhai – gold + diamonds → rings (has receipt)
  const issueId2 = oid(); // Lalibhai  – gold → chain/necklace (has receipt)
  const issueId3 = oid(); // Prabhubhai – gold (in progress)

  await db.collection("karigarIssues").insertMany([
    {
      _id: issueId1,
      issueNo: "KI0001",
      karigarId: karigarId1.toString(),
      karigarName: "Ramjibhai Soni",
      issueDate: "2025-10-12",
      expectedDeliveryDate: "2025-11-20",
      designReference: "SOLITAIRE-RING-22K-8GR",
      gold: [
        { inventoryTransactionId: gpId1.toString(), purity: "916", grossWeight: "20", pureWeight: "18.32" },
      ],
      diamonds: [
        { inventoryTransactionId: dpId1.toString(), sieveSize: "FANCY_OVAL", pcs: "4", carat: "1.00" },
      ],
      notes: "Two rings — one 8g and one 8.5g. Centre stone oval cut.",
      status: "COMPLETED",
      challanUrl: null,
      createdAt: d("2025-10-12"),
      updatedAt: d("2025-11-20"),
    },
    {
      _id: issueId2,
      issueNo: "KI0002",
      karigarId: karigarId2.toString(),
      karigarName: "Lalibhai Suthar",
      issueDate: "2025-10-15",
      expectedDeliveryDate: "2025-11-25",
      designReference: "CHAIN-22G + NECKLACE-35G",
      gold: [
        { inventoryTransactionId: gpId1.toString(), purity: "916", grossWeight: "60", pureWeight: "54.96" },
      ],
      diamonds: [],
      notes: "One 22g curb chain and one 35g classic necklace set.",
      status: "COMPLETED",
      challanUrl: null,
      createdAt: d("2025-10-15"),
      updatedAt: d("2025-11-25"),
    },
    {
      _id: issueId3,
      issueNo: "KI0003",
      karigarId: karigarId3.toString(),
      karigarName: "Prabhubhai Rajput",
      issueDate: "2025-11-01",
      expectedDeliveryDate: "2025-12-15",
      designReference: "JHUMKA-8G-PAIR",
      gold: [
        { inventoryTransactionId: gpId2.toString(), purity: "750", grossWeight: "16", pureWeight: "12" },
      ],
      diamonds: [
        { inventoryTransactionId: dpId1.toString(), sieveSize: "+8", pcs: "20", carat: "0.50" },
      ],
      notes: "18k jhumka pair. Expected before December.",
      status: "ISSUED",
      challanUrl: null,
      createdAt: d("2025-11-01"),
      updatedAt: d("2025-11-01"),
    },
  ]);
  console.log("✓ Created 3 karigar issues");

  // ── 10. Karigar Receipts + Products ──────────────────────────────────────
  const receiptId1 = oid();
  const receiptId2 = oid();

  const prodId1 = oid(); // Diamond solitaire ring (SOLD)
  const prodId2 = oid(); // Diamond solitaire ring (APPROVAL)
  const prodId3 = oid(); // Gold curb chain (AVAILABLE)
  const prodId4 = oid(); // Gold necklace set (AVAILABLE)

  await db.collection("karigarReceipts").insertMany([
    {
      _id: receiptId1,
      receiptNo: "KR0001",
      issueId: issueId1.toString(),
      karigarId: karigarId1.toString(),
      karigarName: "Ramjibhai Soni",
      receiveDate: "2025-11-20",
      labourCharge: "3600",
      labourType: "PER_GRAM",
      jewellery: [
        {
          category: "RING",
          subCategory: "SOLITAIRE",
          productName: "Diamond Solitaire Ring (Lady's)",
          quantity: "1",
          grossWeight: "8.80",
          netWeight: "8.50",
          purity: "916",
          wastage: "2.5",
          makingCharge: "1800",
          makingBasis: "PER_GRAM",
          diamond: [{ sieveSize: "FANCY_OVAL", pcs: "2", carat: "0.50" }],
          remarks: "Hallmarked. BIS 916.",
        },
        {
          category: "RING",
          subCategory: "SOLITAIRE",
          productName: "Diamond Solitaire Ring (Gents)",
          quantity: "1",
          grossWeight: "9.20",
          netWeight: "8.80",
          purity: "916",
          wastage: "2.5",
          makingCharge: "1800",
          makingBasis: "PER_GRAM",
          diamond: [{ sieveSize: "FANCY_OVAL", pcs: "2", carat: "0.50" }],
          remarks: "Hallmarked. BIS 916.",
        },
      ],
      status: "COMPLETED",
      signedReceiptUrl: null,
      productImageUrl: null,
      createdAt: d("2025-11-20"),
      updatedAt: d("2025-11-20"),
    },
    {
      _id: receiptId2,
      receiptNo: "KR0002",
      issueId: issueId2.toString(),
      karigarId: karigarId2.toString(),
      karigarName: "Lalibhai Suthar",
      receiveDate: "2025-11-25",
      labourCharge: "9000",
      labourType: "PER_GRAM",
      jewellery: [
        {
          category: "CHAIN",
          subCategory: "",
          productName: "Gold Curb Chain 22g",
          quantity: "1",
          grossWeight: "22.50",
          netWeight: "22.00",
          purity: "916",
          wastage: "1.5",
          makingCharge: "3300",
          makingBasis: "PER_GRAM",
          diamond: [],
          remarks: "Adjustable length, lobster clasp.",
        },
        {
          category: "NECKLACE",
          subCategory: "MATINEE",
          productName: "Classic Gold Necklace Set",
          quantity: "1",
          grossWeight: "36.00",
          netWeight: "35.00",
          purity: "916",
          wastage: "1.8",
          makingCharge: "5700",
          makingBasis: "PER_GRAM",
          diamond: [],
          remarks: "Includes matching earrings. Box setting.",
        },
      ],
      status: "COMPLETED",
      signedReceiptUrl: null,
      productImageUrl: null,
      createdAt: d("2025-11-25"),
      updatedAt: d("2025-11-25"),
    },
  ]);
  console.log("✓ Created 2 karigar receipts");

  // Products created from receipts
  await db.collection("products").insertMany([
    {
      _id: prodId1,
      jewelCode: "JC0001",
      productName: "Diamond Solitaire Ring (Lady's)",
      category: "RING",
      subCategory: "SOLITAIRE",
      purity: "916",
      grossWeight: "8.80",
      netWeight: "8.50",
      makingCharge: "1800",
      makingBasis: "PER_GRAM",
      wastage: "2.5",
      diamond: [{ sieveSize: "FANCY_OVAL", pcs: "2", carat: "0.50" }],
      receiptId: receiptId1.toString(),
      image: null,
      status: "SOLD",
      remarks: "Hallmarked BIS 916.",
      createdAt: d("2025-11-20"),
      updatedAt: d("2025-12-05"),
    },
    {
      _id: prodId2,
      jewelCode: "JC0002",
      productName: "Diamond Solitaire Ring (Gents)",
      category: "RING",
      subCategory: "SOLITAIRE",
      purity: "916",
      grossWeight: "9.20",
      netWeight: "8.80",
      makingCharge: "1800",
      makingBasis: "PER_GRAM",
      wastage: "2.5",
      diamond: [{ sieveSize: "FANCY_OVAL", pcs: "2", carat: "0.50" }],
      receiptId: receiptId1.toString(),
      image: null,
      status: "APPROVAL",
      remarks: "Hallmarked BIS 916.",
      createdAt: d("2025-11-20"),
      updatedAt: d("2025-12-01"),
    },
    {
      _id: prodId3,
      jewelCode: "JC0003",
      productName: "Gold Curb Chain 22g",
      category: "CHAIN",
      subCategory: "",
      purity: "916",
      grossWeight: "22.50",
      netWeight: "22.00",
      makingCharge: "3300",
      makingBasis: "PER_GRAM",
      wastage: "1.5",
      diamond: [],
      receiptId: receiptId2.toString(),
      image: null,
      status: "AVAILABLE",
      remarks: "Adjustable, lobster clasp.",
      createdAt: d("2025-11-25"),
      updatedAt: d("2025-11-25"),
    },
    {
      _id: prodId4,
      jewelCode: "JC0004",
      productName: "Classic Gold Necklace Set",
      category: "NECKLACE",
      subCategory: "MATINEE",
      purity: "916",
      grossWeight: "36.00",
      netWeight: "35.00",
      makingCharge: "5700",
      makingBasis: "PER_GRAM",
      wastage: "1.8",
      diamond: [],
      receiptId: receiptId2.toString(),
      image: null,
      status: "AVAILABLE",
      remarks: "With matching earrings. Box setting.",
      createdAt: d("2025-11-25"),
      updatedAt: d("2025-11-25"),
    },
  ]);
  console.log("✓ Created 4 products");

  // ── 11. Approval ──────────────────────────────────────────────────────────
  const approvalId1 = oid();

  await db.collection("approvals").insertMany([
    {
      _id: approvalId1,
      approvalNo: "APP-00001",
      customerId: custId1.toString(),
      customerName: "Anita Patel",
      issueDate: "2025-12-01",
      expectedReturnDate: "2025-12-10",
      purpose: "Wedding gifting — evaluating gents solitaire for husband.",
      products: [
        { productId: prodId2.toString(), issueWeight: "9.20", quantity: "1", remarks: "Handle with care." },
      ],
      productCount: 1,
      remarks: "VIP customer. Called on 2025-11-29 to confirm.",
      status: "ISSUED",
      createdAt: d("2025-12-01"),
      updatedAt: d("2025-12-01"),
    },
  ]);
  console.log("✓ Created 1 approval");

  // ── 12. Invoices ──────────────────────────────────────────────────────────
  const invoiceId1 = oid(); // Suresh Mehta  – PAID
  const invoiceId2 = oid(); // Kavya Reddy   – PENDING_PAYMENT

  await db.collection("invoices").insertMany([
    {
      _id: invoiceId1,
      invoiceNo: "INV-00001",
      customerId: custId2.toString(),
      customerName: "Suresh Mehta",
      saleType: "DIRECT",
      approvalId: null,
      invoiceDate: "2025-12-05",
      products: [
        {
          productId: prodId1.toString(),
          quantity: "1",
          goldRate: "7100",
          makingCharge: "15300",
          stoneAmount: "45000",
          discount: "5000",
          gst: "2754",
          rowTotal: "117554",
        },
      ],
      grandTotal: "117554",
      paymentStatus: "PAID",
      remarks: "Cash + UPI split. Suresh insisted on gift wrapping.",
      createdAt: d("2025-12-05"),
      updatedAt: d("2025-12-05"),
    },
    {
      _id: invoiceId2,
      invoiceNo: "INV-00002",
      customerId: custId3.toString(),
      customerName: "Kavya Reddy",
      saleType: "DIRECT",
      approvalId: null,
      invoiceDate: "2025-12-10",
      products: [
        {
          productId: prodId3.toString(),
          quantity: "1",
          goldRate: "7100",
          makingCharge: "3300",
          stoneAmount: "0",
          discount: "0",
          gst: "4305",
          rowTotal: "163805",
        },
      ],
      grandTotal: "163805",
      paymentStatus: "PENDING_PAYMENT",
      remarks: "NEFT payment promised by 15 Dec.",
      createdAt: d("2025-12-10"),
      updatedAt: d("2025-12-10"),
    },
  ]);

  // Mark JC0003 as sold (was AVAILABLE, now on invoice)
  await db.collection("products").updateOne({ _id: prodId3 }, { $set: { status: "SOLD" } });
  console.log("✓ Created 2 invoices");

  // ── 13. Payments ──────────────────────────────────────────────────────────
  const paymentId1 = oid();

  await db.collection("payments").insertMany([
    {
      _id: paymentId1,
      paymentNo: "PAY-00001",
      customerId: custId2.toString(),
      customerName: "Suresh Mehta",
      invoiceId: invoiceId1.toString(),
      invoiceNo: "INV-00001",
      paymentDate: "2025-12-05",
      paymentType: "Cash",
      amount: "117554",
      transactionId: "",
      referenceNumber: "",
      bankName: "",
      attachmentUrl: null,
      remarks: "Paid in full at counter.",
      status: "PAID",
      createdAt: d("2025-12-05"),
      updatedAt: d("2025-12-05"),
    },
  ]);
  console.log("✓ Created 1 payment");

  // ── 14. Reset sequences ───────────────────────────────────────────────────
  await db.collection("sequences").insertMany([
    { _id: "vendor",          value: 3 },
    { _id: "customer",        value: 5 },
    { _id: "karigar",         value: 3 },
    { _id: "goldPurchase",    value: 3 },
    { _id: "diamondPurchase", value: 1 },
    { _id: "karigarIssue",    value: 3 },
    { _id: "karigarReceipt",  value: 2 },
    { _id: "product",         value: 4 },
    { _id: "approval",        value: 1 },
    { _id: "invoice",         value: 2 },
    { _id: "payment",         value: 1 },
  ]);
  console.log("✓ Reset sequences");

  await client.close();

  console.log("\n✅  Demo data loaded successfully!");
  console.log("\nDemo accounts:");
  console.log("  Admin       →  " + (process.env.SEED_ADMIN_EMAIL ?? "(see SEED_ADMIN_EMAIL)") + "  /  password from SEED_ADMIN_PASSWORD");
  console.log("  Manager     →  manager@goldsmith.demo  /  password from SEED_DEMO_PASSWORD");
  console.log("  Sales rep   →  sales@goldsmith.demo    /  password from SEED_DEMO_PASSWORD");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
