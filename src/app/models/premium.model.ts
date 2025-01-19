export interface Premium {
  name: string,
  fee?: number,
  premiumOnly: boolean,
  percentage?: boolean
}

export interface Fee {
  valueInSol: number,
  fee: number,
}
