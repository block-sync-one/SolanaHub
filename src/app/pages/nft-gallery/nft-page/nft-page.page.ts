import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ACCOUNT_SIZE, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getMinimumBalanceForRentExemptAccount } from "../../../../../node_modules/@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

import { firstValueFrom } from 'rxjs';
import { SolanaUtilsService, TxInterceptService } from 'src/app/services';
import { NftStoreService } from 'src/app/services/nft-store.service';
import { Nft, NFTGroup } from '../../../models';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-nft-page',
  templateUrl: './nft-page.page.html',
  styleUrls: ['./nft-page.page.scss'],
})
export class NftPagePage implements OnInit {
  public NFT: Nft;
  public collectionInfo: NFTGroup
  public hideSkelaton: boolean = false;
  public segmentUtilTab: string = ''
  public walletOwner: PublicKey;
  public mintAddressPK: PublicKey;
  public tokenAccountPubkey: PublicKey;
  public sendNftForm: FormGroup;
  public formSubmitted: boolean = false;
  public listStatus: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _nftStoreService: NftStoreService,
    private txInterceptService: TxInterceptService,
    private _walletStore: WalletStore,
    private fb: FormBuilder,
    private solanaUtilsService: SolanaUtilsService,
  ) {

  }

  async ngOnInit() {
    this.sendNftForm = this.fb.group({
      targetAddress: ['', [Validators.required]],
    })
    this.activatedRoute.params.subscribe(async (params) => {
      const mintAddress = params["mintAddress"];
      const dataSet: Nft | any = this.router.getCurrentNavigation()?.extras?.state;
      if (dataSet) {
        this.NFT = dataSet
      } else {
        const mintAddressPK = new PublicKey(mintAddress);
        this.NFT = await this._nftStoreService.getSingleNft(this.walletOwner, mintAddressPK)
      }
      this.walletOwner = await (await firstValueFrom(this._walletStore.anchorWallet$)).publicKey;
      this.mintAddressPK = new PublicKey(this.NFT.mintAddress);
      this.tokenAccountPubkey = await (await this.solanaUtilsService.findAssociatedTokenAddress(this.walletOwner, this.mintAddressPK));
      this.listStatus = await this._nftStoreService.listStatus(this.walletOwner.toBase58(),this.mintAddressPK.toBase58());
    });
  }

  public async sendNft() {
    const targetAdress = this.sendNftForm.value.targetAddress
    console.log(this.sendNftForm.value.targetAddress);
    const targetPublicKey = new PublicKey(targetAdress)
    this.txInterceptService.sendSplOrNft(this.mintAddressPK, this.walletOwner, targetPublicKey, 1)
  }

  public setUtil(util: string): void {
    this.segmentUtilTab = util;
  }
}
