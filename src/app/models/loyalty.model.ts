import { Observable } from "rxjs"

export interface Multipliers {
  _id?: string
  SOL: number
  hubSOL: number
  vSOL: number
  bSOL: number
  veBLZE: number
  referrals: number
  ambassador: number
  hubSOLDeFiBoost: {
    orca: number
    solblaze: number
    kamino: number
    meteora: number
    "the-vault": number
    raydium: number
    mango: number
    solayer: number
    texture: number
    rainfi: number
  }
  questBonusPoints: {
    loyalBoost: {
      degen: number
      manlet: number
      maxi: number
      diamondHand: number
    }
    hubDomain: number
  }
  date: string
}


export interface Season{
  airdrop: number
  season: number
  lastUpdate: Date
  nextUpdate: Date
  totalPoints: number
  totalParticipants: number
  startDate: Date
  endDate: Date
}


export interface loyaltyLeagueMember {
  error?: string,
  airdrop?: number,
  message?: string,
  communityCode?: string,
  nextUpdate?: Date,
  prizePoolShare?: number
  hubDomain?: string,
  referralCode?: string,
  ambassadorPts?: number,
  walletOwner: string,
  totalPts: any,
  stakingPts: number,
  daoPts: number,
  questsPts: number,
  referralPts: number,
  daysLoyal: number,
  quests: { [key: string]: boolean },
  hubSOLBreakdown: { key: string, value: number }[]
}


export interface Tier {
  title: string;
  points: number;
  icon: string;
  iconFull: string;
  loyaltyDaysRequirement: number;
}