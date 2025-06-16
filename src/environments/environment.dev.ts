import { EnvironmentConfig } from "../app/models";
import { EnvironmentName } from "../app/enums";
import { getBaseConfig } from "./base-config";

export const environment: EnvironmentConfig = {
  name: EnvironmentName.Development,
  production: false,
  solanaEnv: 'mainnet-beta',
  solanaCluster: 'https://jori-qte1i2-fast-mainnet.helius-rpc.com',
  apiUrl: "https://dev-api.SolanaHub.app",
  turnStile: '1x00000000000000000000AA',
  ...getBaseConfig()
};
