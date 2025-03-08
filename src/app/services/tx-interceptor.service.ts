import { Injectable, inject, signal } from '@angular/core';

import { BlockheightBasedTransactionConfirmationStrategy, ComputeBudgetProgram, Keypair, PublicKey, Signer, SystemProgram, Transaction, TransactionBlockhashCtor, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Record, toastData } from '../models';
import va from '@vercel/analytics';
import { environment } from 'src/environments/environment';
import { SolanaHelpersService } from './solana-helpers.service';
import { UtilService } from './util.service';
import { ToasterService } from './toaster.service';
import { PortfolioFetchService } from "./portfolio-refetch.service";
import { FreemiumService } from '@app/shared/layouts/freemium';
import { PremiumActions } from "@app/enums";

@Injectable({
  providedIn: 'root'
})
export class TxInterceptorService {
  // private _shs = inject(SolanaHelpersService);
  // private _wallet = this._shs.getCurrentWallet()
  constructor(
    private _toasterService: ToasterService,
    private _shs: SolanaHelpersService,
    private _util: UtilService,
    private _fetchPortfolioService: PortfolioFetchService,
    private _freemiumService: FreemiumService,
  ) { }

  private _memoIx(message: string = 'SolanaHub memo', publicKey: PublicKey) {
    let memo = JSON.stringify({
      value: message
    });
    let memoInstruction = new TransactionInstruction({
      keys: [{
        pubkey: publicKey,
        isSigner: true,
        isWritable: true
      }],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: (new TextEncoder()).encode(memo) as Buffer
    })
    return memoInstruction
  }
  public txState = signal<string>('idle');
  public async sendTx(
    txParam: (TransactionInstruction | Transaction)[],
    walletOwner: PublicKey,
    extraSigners?: Keypair[] | Signer[],
    record?: Record,
    type?: PremiumActions
  ): Promise<string | null> {
    try {
      this.txState.set('preparing');
      const { lastValidBlockHeight, blockhash } = await this._shs.connection.getLatestBlockhash();
      const txArgs: TransactionBlockhashCtor = { feePayer: walletOwner, blockhash, lastValidBlockHeight: lastValidBlockHeight }
      let transaction: Transaction = new Transaction(txArgs).add(...txParam);
      const priorityFeeEst = await this._getPriorityFeeEst(transaction)
      if (priorityFeeEst) transaction.add(priorityFeeEst)

      transaction.add(this._memoIx('SolanaHub memo', walletOwner))
      const serviceFeeInst = this._freemiumService.addServiceFee(walletOwner, type)
      console.log("Platform fee tx", serviceFeeInst);
      if (serviceFeeInst) transaction.add(serviceFeeInst)

      let signedTx = await this._shs.getCurrentWallet().signTransaction(transaction) as Transaction;
      this.txState.set('signed');
      if (extraSigners?.length > 0) signedTx.partialSign(...extraSigners)

      //LMT: check null signatures
      for (let i = 0; i < signedTx.signatures.length; i++) {
        if (!signedTx.signatures[i].signature) {
          throw Error(`missing signature for ${signedTx.signatures[i].publicKey.toString()}. Check .isSigner=true in tx accounts`)
        }
      }
      const rawTransaction = signedTx.serialize({ requireAllSignatures: false });

      const signature = await this._shs.connection.sendRawTransaction(rawTransaction, { skipPreflight: true });
      this.txState.set('sent');
      const url = `${this._util.explorer}/tx/${signature}?cluster=${environment.solanaEnv}`
      const txSend: toastData = {
        message: `Transaction Submitted`,
        btnText: `view on explorer`,
        segmentClass: "toastInfo",
        duration: 5000,
        cb: () => window.open(url)
      }
      this._toasterService.msg.next(txSend)
      const config: BlockheightBasedTransactionConfirmationStrategy = {
        signature, blockhash, lastValidBlockHeight//.lastValidBlockHeight
      }
      if (record) {
        record.data.txId = signature
        va.track(record.message, record.data)
      }
      await this._shs.connection.confirmTransaction(config, 'processed')
      this.txState.set('confirmed');
      const txCompleted: toastData = {
        message: 'Transaction Completed',
        segmentClass: "toastInfo"
      }

      this._toasterService.msg.next(txCompleted)

      setTimeout(() => {
        this._fetchPortfolioService.triggerFetch()
      }, 500);
      this.txState.set('idle');
      return signature
    } catch (error) {
      console.warn(error);
      return null
    }
  }
  public async sendMultipleTxn(
    transactions: (Transaction | VersionedTransaction)[],
    extraSigners?: Keypair[] | Signer[],
    record?: { message: string, data?: {} },
  ): Promise<string[]> {
    const { lastValidBlockHeight, blockhash } = await this._shs.connection.getLatestBlockhash();

    // Handle priority fees for each transaction based on its type
    // const txWithPriorityFees = []
    // await Promise.all(transactions.map(async t => {
    //   const priorityFeeEst = await this._getPriorityFeeEst(t);
    //   if (t instanceof Transaction) {
    //         t.add(priorityFeeEst);
    //         txWithPriorityFees.push(t)
    //   } else if (t instanceof VersionedTransaction) {
    //     // Get existing instructions from the versioned transaction
    //     const batchMessage = new TransactionMessage({
    //       payerKey: this._shs.getCurrentWallet().publicKey,
    //       recentBlockhash: blockhash,
    //       instructions: [priorityFeeEst],
    //     }).compileToV0Message();
    //     const txWithFee = new VersionedTransaction(batchMessage);
    //     txWithPriorityFees.push(t, txWithFee)
    //   }

    // }));
    // console.log('txWithPriorityFees', txWithPriorityFees);
    let signedTx = await this._shs.getCurrentWallet().signAllTransactions(transactions) as (Transaction | VersionedTransaction)[];
    if (extraSigners?.length > 0) signedTx.map(s => s instanceof Transaction ? s.partialSign(...extraSigners) : s)

    var signatures = [];
    var successfulSignatures = [];

    // Send all transactions first
    for await (const tx of signedTx) {
      try {
        const rawTransaction = tx.serialize({ requireAllSignatures: false })
        const confirmTransaction = await this._shs.connection.sendRawTransaction(rawTransaction, { skipPreflight: true });
        signatures.push(confirmTransaction);
      } catch (error) {
        console.warn('Failed to send transaction:', error);
      }
    }

    const url = `${this._util.explorer}/tx/${signatures[0]}?cluster=${environment.solanaEnv}`

    // Show initial toast for submitted transactions
    const txSend: toastData = {
      message: `Transactions Submitted`,
      btnText: `view on explorer`,
      segmentClass: "toastInfo",
      duration: 50000,
      cb: () => window.open(url)
    }
    this._toasterService.msg.next(txSend)

    // Confirm all transactions
    for (const signature of signatures) {
      try {
        const config: BlockheightBasedTransactionConfirmationStrategy = {
          signature, blockhash, lastValidBlockHeight
        }
        await this._shs.connection.confirmTransaction(config, 'processed')
        successfulSignatures.push(signature);
      } catch (error) {
        console.warn('Failed to confirm transaction:', signature, error);
      }
    }

    // Show completion toast only if at least one transaction succeeded
    if (successfulSignatures.length > 0) {
      const txCompleted: toastData = {
        message: `${successfulSignatures.length}/${signatures.length} Transactions Completed`,
        segmentClass: "toastInfo"
      }
      if (record) {
        va.track(record.message, record.data)
      }
      this._toasterService.msg.next(txCompleted)

      setTimeout(() => {
        this._fetchPortfolioService.triggerFetch()
      }, 1500);
    }

    return successfulSignatures;
  }

  public async sendSol(lamportsToSend: number, toAddress: PublicKey, walletOwnerPk: PublicKey): Promise<any> {
    const transfer: TransactionInstruction =
      SystemProgram.transfer({
        fromPubkey: walletOwnerPk,
        toPubkey: toAddress,
        lamports: lamportsToSend,
      })
    this.sendTx([transfer], walletOwnerPk)
  }

  private async _getPriorityFeeEst(transaction: Transaction | VersionedTransaction) {
    // if transaction is array then return array of
    // Extract all account keys from the transaction
    const accountKeys = transaction instanceof Transaction ? transaction.compileMessage().accountKeys : transaction.message.staticAccountKeys;
    // Convert PublicKeys to base58 strings
    const publicKeys = accountKeys.map(key => key.toBase58());

    try {
      const response = await fetch(this._shs.connection.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'helius-example',
          method: 'getPriorityFeeEstimate',
          params: [
            {
              accountKeys: publicKeys,
              options: {
                evaluateEmptySlotAsZero: true,
                recommended: true,
              },
            }
          ],
        }),
      });

      const data = await response.json();

      const priorityFeeEstimate = data.result?.priorityFeeEstimate;
      console.log(data);

      // Add the priority fee to the transaction
      console.log("Estimated priority fee:", priorityFeeEstimate);

      return ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFeeEstimate ? priorityFeeEstimate : 20_000
      })



    } catch (err) {
      console.error(`Error: ${err}`);
      return ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 20_000
      })
    }

  }
}
