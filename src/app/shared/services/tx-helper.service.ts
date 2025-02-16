import {inject, Injectable} from '@angular/core';
import {Transaction, TransactionInstruction, VersionedTransaction} from "@solana/web3.js";
import { SolanaHelpersService} from "@app/services";

@Injectable({
  providedIn: 'root'
})
export class TxHelperService {
  private readonly _shs = inject(SolanaHelpersService);
  private static MAX_SIZE = 900;

  /**
   * Converts an array of transaction instructions into a standardized array of transactions.
   *
   * @param {TransactionInstruction[] | VersionedTransaction[] | Transaction[]} ixs
   *   The input array of transaction instructions or transactions
   * @returns {Promise<(Transaction | VersionedTransaction)[]>}
   *   A promise resolving to an array of either Transaction or VersionedTransaction objects
   */
  public async toTransactions(ixs: TransactionInstruction[] | VersionedTransaction[] | Transaction[]): Promise<(Transaction | VersionedTransaction)[]> {
    if (ixs[0] instanceof VersionedTransaction) {
      return ixs as VersionedTransaction[];
    }

    if (ixs[0] instanceof Transaction) {
      return ixs as Transaction[];
    }

    return await this.splitIntoSubTransactions(ixs as TransactionInstruction[]);
  }


  /**
   * Splits an array of transaction instructions into multiple transactions based on size constraints.
   *
   * @private
   * @async
   * @param {TransactionInstruction[]} instructions - Array of transaction instructions to process
   * @param {number} [maxSize=900] - Maximum size in bytes for each transaction
   * @returns {Promise<Transaction[]>} Promise resolving to an array of split transactions
   * @throws {Error} If transaction size validation fails
   */
  private async splitIntoSubTransactions(
    instructions: TransactionInstruction[],
    maxSize: number = TxHelperService.MAX_SIZE
  ): Promise<Transaction[]> {
    const {publicKey} = this._shs.getCurrentWallet();
    const {blockhash} = await this._shs.connection.getLatestBlockhash();
    const transactions: Transaction[] = [];
    let currentInstructions: TransactionInstruction[] = [];

    for (const instruction of instructions) {
      // ... existing instruction size check ...

      currentInstructions.push(instruction);

      if (currentInstructions.length > 1) {
        try {
          // Create legacy transaction for size testing
          const testTx = new Transaction().add(...currentInstructions);
          testTx.recentBlockhash = blockhash;
          testTx.feePayer = publicKey;
          const serializedSize = testTx.serialize({requireAllSignatures: false}).length;

          if (serializedSize > maxSize) {
            currentInstructions.pop();
            // Create legacy transaction for batch
            const batchTx = new Transaction().add(...currentInstructions);
            batchTx.recentBlockhash = blockhash;
            batchTx.feePayer = publicKey;
            transactions.push(batchTx);
            currentInstructions = [instruction];
          }
        } catch (error) {
          console.error('Error while checking transaction size:', error);
          if (currentInstructions.length > 1) {
            currentInstructions.pop();
            const batchTx = new Transaction().add(...currentInstructions);
            batchTx.recentBlockhash = blockhash;
            batchTx.feePayer = publicKey;
            transactions.push(batchTx);
            currentInstructions = [instruction];
          }
        }
      }
    }

    // Process remaining instructions
    if (currentInstructions.length > 0) {
      const finalTx = new Transaction().add(...currentInstructions);
      finalTx.recentBlockhash = blockhash;
      finalTx.feePayer = publicKey;
      transactions.push(finalTx);
    }

    console.log('transactions', transactions.length);

    return transactions;
  }
}
