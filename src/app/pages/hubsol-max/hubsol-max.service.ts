import { Injectable } from '@angular/core';
import { PublicKey, Connection } from '@solana/web3.js';
// import  {PoolFarmImpl}  from './ts-client/src/farm';
import { PoolFarmImpl } from './dist';
@Injectable({
  providedIn: 'root'
})
export class HubsolMaxService {

  public async initFarmPool() {
    // Alternatively, to use Solana Wallet Adapter

    const HUBSOL_FARM_POOL = new PublicKey(
      "79Tt2nKqepXCVTf1yz8f6UKaB3NkWQNYWx2HfSoHK5r7"
    ); // Pool Address can get from https://docs.meteora.ag/dynamic-pools-integration/dynamic-pool-api/pool-info
    const connection = new Connection("https://truda-rbrotf-fast-devnet.helius-rpc.com");
    const farmingPools = await PoolFarmImpl.create(
      connection,
      HUBSOL_FARM_POOL
    );
    console.log(farmingPools);
    
    // // farmingPools is an array (A pool can have multiple farms)
    // const farmingPool = farmingPools[0];
    // const farm = await PoolFarmImpl.create(
    //   connection,
    //   farmingPool.farmAddress
    // );
    // console.log(farm);
  }

}
