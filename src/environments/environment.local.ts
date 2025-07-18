import {getBaseConfig} from "./base-config";
import {EnvironmentConfig} from "../app/models";
import {EnvironmentName} from "../app/enums";

export const environment: EnvironmentConfig = {
  name: EnvironmentName.Local,
  production: false,
  solanaEnv: 'mainnet-beta',
  solanaCluster: 'https://jori-qte1i2-fast-mainnet.helius-rpc.com',
  apiUrl: "http://localhost:3000",
  turnStile: '1x00000000000000000000AA',
  ...getBaseConfig()
};
