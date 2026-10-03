export type ImeiStatus = "Unused" | "Used" | "Blocked"
export type ImeiRegistryStatus = ImeiStatus | "Winning Pending" | "Claimed" | "Rejected"
export type ImeiSource = "Manual" | "Import"

export type AssignedPrize = "SilverKite" | "SilverCoin" | "GoldKite" | null

export type ImeiRecord = {
  id: string
  imei: string
  deviceModel: string
  batch: string
  status: ImeiRegistryStatus
  validationAttempts: number
  participantName: string | null
  addedAt: string
  source: ImeiSource
  assignedPrize: AssignedPrize
  expectedRetailer: string | null
}

export type CampaignStatus = "Draft" | "Scheduled" | "Active" | "Paused" | "Completed"

export type ParticipationValidation =
  | "Eligible"
  | "IMEI Not Found"
  | "Invalid IMEI"
  | "Already Participated"
  | "Blocked"
  | "Campaign Not Active"
  | "System Error"

export type ScratchOutcome = "Silver Kite" | "Silver Coin" | "Try Again" | "Pending"
export type GoldKiteStatus = "Eligible" | "Not Eligible" | "Pending" | "Winner"

export type VerificationStatus = "Pending" | "Confirmed" | "Rejected"

/** DB enum values for scratch_results.outcome */
export type ScratchOutcomeDb = "SilverKite" | "SilverCoin" | "TryAgain" | "Pending"

export type ParticipantRow = {
  id: string
  name: string
  mobile: string
  imei: string
  retailerEntered: string
  retailerAddress: string | null
  retailerExpected: string | null
  /** scratch_results row the Pass/Fail actions act on. */
  scratchResultId: string | null
  scratch: ScratchOutcome
  verification: VerificationStatus | null
  participatedAt: string
}
