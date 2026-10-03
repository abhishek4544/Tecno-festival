import type { ParticipantRow } from "@/lib/types"

const seed: Array<{
  name: string
  retailerEntered: string
  retailerExpected: string | null
  scratch: ParticipantRow["scratch"]
  verification: ParticipantRow["verification"]
}> = [
  // Pending wins — admin can Pass/Fail
  {
    name: "Rajesh Shrestha",
    retailerEntered: "ABC Mobile · New Road",
    retailerExpected: "ABC Mobile · New Road",
    scratch: "Silver Kite",
    verification: "Pending",
  },
  {
    name: "Anita Karki",
    retailerEntered: "Himalayan Electronics · Pokhara",
    retailerExpected: "Himalayan Electronics · Pokhara",
    scratch: "Silver Coin",
    verification: "Pending",
  },
  {
    // Retailer mismatch — admin should probably Fail
    name: "Sabin Lama",
    retailerEntered: "Everest Phones · Thamel",
    retailerExpected: "Kathmandu Mobile Hub · Lalitpur",
    scratch: "Silver Coin",
    verification: "Pending",
  },
  {
    name: "Bikash Thapa",
    retailerEntered: "Smart Gadgets · Bhaktapur",
    retailerExpected: "Smart Gadgets · Bhaktapur",
    scratch: "Silver Kite",
    verification: "Pending",
  },
  // Already resolved
  {
    name: "Pratima Rai",
    retailerEntered: "Pokhara Mobile Centre",
    retailerExpected: "Pokhara Mobile Centre",
    scratch: "Silver Coin",
    verification: "Confirmed",
  },
  {
    name: "Nabin Gurung",
    retailerEntered: "Butwal Mobile Store",
    retailerExpected: "Butwal Mobile Store",
    scratch: "Silver Kite",
    verification: "Confirmed",
  },
  {
    name: "Sita Bhattarai",
    retailerEntered: "Random Shop",
    retailerExpected: "ABC Mobile · New Road",
    scratch: "Silver Coin",
    verification: "Rejected",
  },
  // Non-wins — nothing to verify
  {
    name: "Milan Adhikari",
    retailerEntered: "ABC Mobile · New Road",
    retailerExpected: "ABC Mobile · New Road",
    scratch: "Try Again",
    verification: null,
  },
  {
    name: "Puja Tamang",
    retailerEntered: "Himalayan Electronics · Pokhara",
    retailerExpected: "Himalayan Electronics · Pokhara",
    scratch: "Try Again",
    verification: null,
  },
  {
    name: "Dipak Magar",
    retailerEntered: "Everest Phones · Thamel",
    retailerExpected: "Everest Phones · Thamel",
    scratch: "Pending",
    verification: null,
  },
  {
    name: "Sarita Poudel",
    retailerEntered: "Kathmandu Mobile Hub · Lalitpur",
    retailerExpected: "Kathmandu Mobile Hub · Lalitpur",
    scratch: "Try Again",
    verification: null,
  },
  {
    name: "Hari Khadka",
    retailerEntered: "Butwal Mobile Store",
    retailerExpected: "Butwal Mobile Store",
    scratch: "Silver Coin",
    verification: "Confirmed",
  },
]

export const mockParticipants: ParticipantRow[] = seed.map((s, i) => ({
  id: `p-${i + 1}`,
  name: s.name,
  mobile: `98${String(10000000 + i * 1337).slice(0, 8)}`,
  imei: (869000000000000 + i * 1337).toString().slice(0, 15),
  retailerEntered: s.retailerEntered,
  retailerExpected: s.retailerExpected,
  scratch: s.scratch,
  verification: s.verification,
  participatedAt: new Date(
    2026,
    8,
    5 + (i % 25),
    9 + (i % 10),
    i % 60,
  ).toISOString(),
}))
