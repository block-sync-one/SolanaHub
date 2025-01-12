// RPC or explorer interface

export interface Config {
  name: string,
  imageURL: string,
  icon?: string,
  value: string | number,
}



export interface BaseConfig {
  platformFeeCollector: string;
  rpcs: Config[],
  explorers: Config[],
  Theme: Config[],
}

export interface EnvironmentConfig {
  readonly name: string;
  readonly production: boolean;
  readonly solanaEnv: string;
  readonly solanaCluster: string;
  readonly apiUrl: string;
  readonly platformFeeCollector: string;
  readonly rpcs: Config[];
  readonly explorers: Config[];
  readonly Theme: Config[];
  readonly turnStile: string;
}
