import {StakePool, StakePoolInstruction, ValidatorStakeInfo, WithdrawAccount, getStakeAccount, getStakePoolAccount} from "@solana/spl-stake-pool";
import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, StakeAuthorizationLayout, StakeProgram, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {divideBnToNumber, getAssociatedTokenAccountAddress} from "@marinade.finance/marinade-ts-sdk/dist/src/util";
import {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createApproveInstruction, getAccount, getAssociatedTokenAddressSync} from 'node_modules/@solana/spl-token';
import { BN } from "@marinade.finance/marinade-ts-sdk";
import { publicKey, struct, u32, u64, u8, option, vec } from '@coral-xyz/borsh';
export const MINIMUM_ACTIVE_STAKE = 1000000000;
export const ValidatorStakeInfoLayout = struct<ValidatorStakeInfo>([
  /// Amount of active stake delegated to this validator
  /// Note that if `last_update_epoch` does not match the current epoch then
  /// this field may not be accurate
  u64('activeStakeLamports'),
  /// Amount of transient stake delegated to this validator
  /// Note that if `last_update_epoch` does not match the current epoch then
  /// this field may not be accurate
  u64('transientStakeLamports'),
  /// Last epoch the active and transient stake lamports fields were updated
  u64('lastUpdateEpoch'),
  /// Start of the validator transient account seed suffixes
  u64('transientSeedSuffixStart'),
  /// End of the validator transient account seed suffixes
  u64('transientSeedSuffixEnd'),
  /// Status of the validator stake account
  u8('status'),
  /// Validator vote account address
  publicKey('voteAccountAddress'),
]);

export const ValidatorListLayout = struct<ValidatorList>([
  u8('accountType'),
  u32('maxValidators'),
  vec(ValidatorStakeInfoLayout, 'validators'),
]);

export interface Fee {
  denominator: BN;
  numerator: BN;
}
export const TRANSIENT_STAKE_SEED_PREFIX = Buffer.from('transient');
export function calcPoolTokensForDeposit(stakePool: StakePool, stakeLamports: number): number {
  if (stakePool.poolTokenSupply.isZero() || stakePool.totalLamports.isZero()) {
    return stakeLamports;
  }
  return Math.floor(
    divideBnToNumber(new BN(stakeLamports).mul(stakePool.poolTokenSupply), stakePool.totalLamports),
  );
}
export async function findTransientStakeProgramAddress(
  programId: PublicKey,
  voteAccountAddress: PublicKey,
  stakePoolAddress: PublicKey,
  seed: BN,
) {
  const [publicKey] = await PublicKey.findProgramAddress(
    [
      TRANSIENT_STAKE_SEED_PREFIX,
      voteAccountAddress.toBuffer(),
      stakePoolAddress.toBuffer(),
      seed.toBuffer('le', 8),
    ],
    programId,
  );
  return publicKey;
}
export enum ValidatorStakeInfoStatus {
  Active,
  DeactivatingTransient,
  ReadyForRemoval,
}
export async function prepareWithdrawAccounts(
  STAKE_POOL_PROGRAM_ID_SEGMENTED: PublicKey,
  connection: Connection,
  stakePool: StakePool,
  stakePoolAddress: PublicKey,
  amount: number,
  compareFn?: (a: ValidatorAccount, b: ValidatorAccount) => number,
  skipFee?: boolean,
): Promise<WithdrawAccount[]> {
  const validatorListAcc = await connection.getAccountInfo(stakePool.validatorList);
  const validatorList = ValidatorListLayout.decode(validatorListAcc?.data) as ValidatorList;

  if (!validatorList?.validators || validatorList?.validators.length == 0) {
    throw new Error('No accounts found');
  }

  const minBalanceForRentExemption = await connection.getMinimumBalanceForRentExemption(
    StakeProgram.space,
  );
  const minBalance = minBalanceForRentExemption + MINIMUM_ACTIVE_STAKE;

  let accounts = [] as Array<{
    type: 'preferred' | 'active' | 'transient' | 'reserve';
    voteAddress?: PublicKey | undefined;
    stakeAddress: PublicKey;
    lamports: number;
  }>;

  // Prepare accounts
  for (const validator of validatorList.validators) {
    if (validator.status !== ValidatorStakeInfoStatus.Active) {
      continue;
    }

    const stakeAccountAddress = await findStakeProgramAddress(
      STAKE_POOL_PROGRAM_ID_SEGMENTED,
      validator.voteAccountAddress,
      stakePoolAddress,
    );

    if (!validator.activeStakeLamports.isZero()) {
      const isPreferred = stakePool?.preferredWithdrawValidatorVoteAddress?.equals(
        validator.voteAccountAddress,
      );
      accounts.push({
        type: isPreferred ? 'preferred' : 'active',
        voteAddress: validator.voteAccountAddress,
        stakeAddress: stakeAccountAddress,
        lamports: validator.activeStakeLamports.toNumber(),
      });
    }

    const transientStakeLamports = validator.transientStakeLamports.toNumber() - minBalance;
    if (transientStakeLamports > 0) {
      const transientStakeAccountAddress = await findTransientStakeProgramAddress(
        STAKE_POOL_PROGRAM_ID,
        validator.voteAccountAddress,
        stakePoolAddress,
        validator.transientSeedSuffixStart,
      );
      accounts.push({
        type: 'transient',
        voteAddress: validator.voteAccountAddress,
        stakeAddress: transientStakeAccountAddress,
        lamports: transientStakeLamports,
      });
    }
  }

  // Sort from highest to lowest balance
  accounts = accounts.sort(compareFn ? compareFn : (a, b) => b.lamports - a.lamports);

  const reserveStake = await connection.getAccountInfo(stakePool.reserveStake);
  const reserveStakeBalance = (reserveStake?.lamports ?? 0) - minBalanceForRentExemption;
  if (reserveStakeBalance > 0) {
    accounts.push({
      type: 'reserve',
      stakeAddress: stakePool.reserveStake,
      lamports: reserveStakeBalance,
    });
  }

  // Prepare the list of accounts to withdraw from
  const withdrawFrom: WithdrawAccount[] = [];
  let remainingAmount = amount;

  const fee = stakePool.stakeWithdrawalFee;
  const inverseFee: Fee = {
    numerator: fee.denominator.sub(fee.numerator),
    denominator: fee.denominator,
  };

  for (const type of ['preferred', 'active', 'transient', 'reserve']) {
    const filteredAccounts = accounts.filter((a) => a.type == type);

    for (const { stakeAddress, voteAddress, lamports } of filteredAccounts) {
      if (lamports <= minBalance && type == 'transient') {
        continue;
      }

      let availableForWithdrawal = calcPoolTokensForDeposit(stakePool, lamports);

      if (!skipFee && !inverseFee.numerator.isZero()) {
        availableForWithdrawal = divideBnToNumber(
          new BN(availableForWithdrawal).mul(inverseFee.denominator),
          inverseFee.numerator,
        );
      }

      const poolAmount = Math.min(availableForWithdrawal, remainingAmount);
      if (poolAmount <= 0) {
        continue;
      }

      // Those accounts will be withdrawn completely with `claim` instruction
      withdrawFrom.push({ stakeAddress, voteAddress, poolAmount });
      remainingAmount -= poolAmount;

      if (remainingAmount == 0) {
        break;
      }
    }

    if (remainingAmount == 0) {
      break;
    }
  }

  // Not enough stake to withdraw the specified amount
  if (remainingAmount > 0) {
    throw new Error(
      `No stake accounts found in this pool with enough balance to withdraw ${lamportsToSol(
        amount,
      )} pool tokens.`,
    );
  }

  return withdrawFrom;
}



export interface ValidatorList {
  accountType: number;
  maxValidators: number;
  validators: ValidatorStakeInfo[];
}
export function newStakeAccount(
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  lamports: number,
): Keypair {
  // Account for tokens not specified, creating one
  const stakeReceiverKeypair = Keypair.generate();
  console.log(`Creating account to receive stake ${stakeReceiverKeypair.publicKey}`);

  instructions.push(
    // Creating new account
    SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: stakeReceiverKeypair.publicKey,
      lamports,
      space: StakeProgram.space,
      programId: StakeProgram.programId,
    }),
  );

  return stakeReceiverKeypair;
}
export function calcLamportsWithdrawAmount(stakePool: StakePool, poolTokens: number): number {
  const numerator = new BN(poolTokens).mul(stakePool.totalLamports);
  const denominator = stakePool.poolTokenSupply;
  if (numerator.lt(denominator)) {
    return 0;
  }
  return divideBnToNumber(numerator, denominator);
}
export function solToLamports(amount: number): number {
  if (isNaN(amount)) return Number(0);
  return Number(Number(amount * LAMPORTS_PER_SOL).toString().split(".")[0]);
}
export interface ValidatorAccount {
  type: 'preferred' | 'active' | 'transient' | 'reserve';
  voteAddress?: PublicKey | undefined;
  stakeAddress: PublicKey;
  lamports: number;
}
const STAKE_POOL_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY')
// const STAKE_POOL_MVP_PROGRAM_ID = new PublicKey('SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn')

export function lamportsToSol(amount) {
    return amount / 10 ** 9
}
export async function findStakeProgramAddress(
    programId: PublicKey,
    voteAccountAddress: PublicKey,
    stakePoolAddress: PublicKey,
  ) {
    const [publicKey] = await PublicKey.findProgramAddress(
      [voteAccountAddress.toBuffer(), stakePoolAddress.toBuffer()],
      programId,
    );
    return publicKey;
  }
export async function findWithdrawAuthorityProgramAddress(
    programId,
    stakePoolAddress,
) {
    const [publicKey] = await PublicKey.findProgramAddress(
        [stakePoolAddress.toBuffer(), Buffer.from('withdraw')],
        programId,
    );
    return publicKey;
}


export function createAssociatedTokenAccountIdempotentInstruction(
    payer,
    associatedToken,
    owner,
    mint,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) {
    return buildAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        Buffer.from([1]),
        programId,
        associatedTokenProgramId
    );
}
function buildAssociatedTokenAccountInstruction(
    payer,
    associatedToken,
    owner,
    mint,
    instructionData,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data: instructionData,
    });
}



export async function depositSolIntoSanctum(
    connection,
    stakePoolAddress,
    from,
    lamports,
    destinationTokenAccount,
    referrerTokenAccount,
    depositAuthority,
) {
    const fromBalance = await connection.getBalance(from, 'confirmed');
    if (fromBalance < lamports) {
        throw new Error(
            `Not enough SOL to deposit into pool. Maximum deposit amount is ${lamportsToSol(
                fromBalance,
            )} SOL.`,
        );
    }

    const stakePoolAccount = await getStakePoolAccount(connection, stakePoolAddress);
    const stakePool = stakePoolAccount.account.data;

    // Ephemeral SOL account just to do the transfer
    const userSolTransfer = new Keypair();
    const signers = [userSolTransfer];
    const instructions = [];

    // Create the ephemeral SOL account
    instructions.push(
        SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: userSolTransfer.publicKey,
            lamports,
        }),
    );

    // Create token account if not specified
    if (!destinationTokenAccount) {
        const associatedAddress = await getAssociatedTokenAccountAddress(stakePool.poolMint, from);
        instructions.push(

            createAssociatedTokenAccountIdempotentInstruction(
                from,
                associatedAddress,
                from,
                stakePool.poolMint,
            ),
        );
        destinationTokenAccount = associatedAddress;
    }

    const withdrawAuthority = await findWithdrawAuthorityProgramAddress(
        STAKE_POOL_PROGRAM_ID,
        stakePoolAddress,
    );

    let depositInstruction = StakePoolInstruction.depositSol({
        stakePool: stakePoolAddress,
        reserveStake: stakePool.reserveStake,
        fundingAccount: userSolTransfer.publicKey,
        destinationPoolAccount: destinationTokenAccount,
        managerFeeAccount: stakePool.managerFeeAccount,
        referralPoolAccount: referrerTokenAccount ?? destinationTokenAccount,
        poolMint: stakePool.poolMint,
        lamports,
        withdrawAuthority,
        depositAuthority,
    });
    depositInstruction.programId = STAKE_POOL_PROGRAM_ID;
    instructions.push(
        depositInstruction,
    );

    return {
        instructions,
        signers,
    };
}

export async function depositStakeIntoSanctum(
    connection: Connection,
    stakePoolAddress: PublicKey,
    authorizedPubkey: PublicKey,
    validatorVote: PublicKey,
    depositStake: PublicKey,
    poolTokenReceiverAccount?: PublicKey,
  ) {
    const stakePool = await getStakePoolAccount(connection, stakePoolAddress);
  
    const withdrawAuthority = await findWithdrawAuthorityProgramAddress(
      STAKE_POOL_PROGRAM_ID,
      stakePoolAddress,
    );
  
    const validatorStake = await findStakeProgramAddress(
      STAKE_POOL_PROGRAM_ID,
      validatorVote,
      stakePoolAddress,
    );
  
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
  
    const poolMint = stakePool.account.data.poolMint;
  
    // Create token account if not specified
    if (!poolTokenReceiverAccount) {
      const associatedAddress = getAssociatedTokenAddressSync(poolMint, authorizedPubkey);
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          authorizedPubkey,
          associatedAddress,
          authorizedPubkey,
          poolMint,
        ),
      );
      poolTokenReceiverAccount = associatedAddress;
    }
  
    instructions.push(
      ...StakeProgram.authorize({
        stakePubkey: depositStake,
        authorizedPubkey,
        newAuthorizedPubkey: stakePool.account.data.stakeDepositAuthority,
        stakeAuthorizationType: StakeAuthorizationLayout.Staker,
      }).instructions,
    );
  
    instructions.push(
      ...StakeProgram.authorize({
        stakePubkey: depositStake,
        authorizedPubkey,
        newAuthorizedPubkey: stakePool.account.data.stakeDepositAuthority,
        stakeAuthorizationType: StakeAuthorizationLayout.Withdrawer,
      }).instructions,
    );
    let depositInstruction = StakePoolInstruction.depositStake({
        stakePool: stakePoolAddress,
        validatorList: stakePool.account.data.validatorList,
        depositAuthority: stakePool.account.data.stakeDepositAuthority,
        reserveStake: stakePool.account.data.reserveStake,
        managerFeeAccount: stakePool.account.data.managerFeeAccount,
        referralPoolAccount: poolTokenReceiverAccount,
        destinationPoolAccount: poolTokenReceiverAccount,
        withdrawAuthority,
        depositStake,
        validatorStake,
        poolMint,
      })
    depositInstruction.programId = STAKE_POOL_PROGRAM_ID;
    instructions.push(
        depositInstruction
    );
  
    return {
      instructions,
      signers,
    };
  }
  

  export async function withdrawStakeFromSanctum(
    STAKE_POOL_PROGRAM_ID_SEGMENTED: PublicKey,
    connection: Connection,
    stakePoolAddress: PublicKey,
    tokenOwner: PublicKey,
    amount: number,
    useReserve = false,
    voteAccountAddress?: PublicKey,
    stakeReceiver?: PublicKey,
    poolTokenAccount?: PublicKey,
    validatorComparator?: (_a: ValidatorAccount, _b: ValidatorAccount) => number,
  ) {
    const stakePool = await getStakePoolAccount(connection, stakePoolAddress);
    const poolAmount = solToLamports(amount);
  
    if (!poolTokenAccount) {
      poolTokenAccount = getAssociatedTokenAddressSync(stakePool.account.data.poolMint, tokenOwner);
    }
  
    const tokenAccount = await getAccount(connection, poolTokenAccount);
  
    // Check withdrawFrom balance
    if (tokenAccount.amount < poolAmount) {
      throw new Error(
        `Not enough token balance to withdraw ${lamportsToSol(poolAmount)} pool tokens.
          Maximum withdraw amount is ${lamportsToSol(tokenAccount.amount)} pool tokens.`,
      );
    }
  
    const stakeAccountRentExemption = await connection.getMinimumBalanceForRentExemption(
      StakeProgram.space,
    );
  
    const withdrawAuthority = await findWithdrawAuthorityProgramAddress(
      STAKE_POOL_PROGRAM_ID_SEGMENTED,
      stakePoolAddress,
    );
  
    let stakeReceiverAccount = null;
    if (stakeReceiver) {
      stakeReceiverAccount = await getStakeAccount(connection, stakeReceiver);
    }
  
    const withdrawAccounts: WithdrawAccount[] = [];
  
    if (useReserve) {
      withdrawAccounts.push({
        stakeAddress: stakePool.account.data.reserveStake,
        voteAddress: undefined,
        poolAmount,
      });
    } else if (stakeReceiverAccount && stakeReceiverAccount?.type == 'delegated') {
      const voteAccount = stakeReceiverAccount.info?.stake?.delegation.voter;
      if (!voteAccount) throw new Error(`Invalid stake reciever ${stakeReceiver} delegation`);
      const validatorListAccount = await connection.getAccountInfo(
        stakePool.account.data.validatorList,
      );
      const validatorList = ValidatorListLayout.decode(validatorListAccount?.data) as ValidatorList;
      const isValidVoter = validatorList.validators.find((val) =>
        val.voteAccountAddress.equals(voteAccount),
      );
      if (voteAccountAddress && voteAccountAddress !== voteAccount) {
        throw new Error(`Provided withdrawal vote account ${voteAccountAddress} does not match delegation on stake receiver account ${voteAccount},
        remove this flag or provide a different stake account delegated to ${voteAccountAddress}`);
      }
      if (isValidVoter) {
        const stakeAccountAddress = await findStakeProgramAddress(
          STAKE_POOL_PROGRAM_ID_SEGMENTED,
          voteAccount,
          stakePoolAddress,
        );
  
        const stakeAccount = await connection.getAccountInfo(stakeAccountAddress);
        if (!stakeAccount) {
          throw new Error(`Preferred withdraw valdator's stake account is invalid`);
        }
  
        const availableForWithdrawal = calcLamportsWithdrawAmount(
          stakePool.account.data,
          stakeAccount.lamports - MINIMUM_ACTIVE_STAKE - stakeAccountRentExemption,
        );
  
        if (availableForWithdrawal < poolAmount) {
          throw new Error(
            `Not enough lamports available for withdrawal from ${stakeAccountAddress},
              ${poolAmount} asked, ${availableForWithdrawal} available.`,
          );
        }
        withdrawAccounts.push({
          stakeAddress: stakeAccountAddress,
          voteAddress: voteAccount,
          poolAmount,
        });
      } else {
        throw new Error(
          `Provided stake account is delegated to a vote account ${voteAccount} which does not exist in the stake pool`,
        );
      }
    } else if (voteAccountAddress) {
      const stakeAccountAddress = await findStakeProgramAddress(
        STAKE_POOL_PROGRAM_ID_SEGMENTED,
        voteAccountAddress,
        stakePoolAddress,
      );
      const stakeAccount = await connection.getAccountInfo(stakeAccountAddress);
      if (!stakeAccount) {
        throw new Error('Invalid Stake Account');
      }
  
      const availableForWithdrawal = calcLamportsWithdrawAmount(
        stakePool.account.data,
        stakeAccount.lamports - MINIMUM_ACTIVE_STAKE - stakeAccountRentExemption,
      );
  
      if (availableForWithdrawal < poolAmount) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(
          `Not enough lamports available for withdrawal from ${stakeAccountAddress},
            ${poolAmount} asked, ${availableForWithdrawal} available.`,
        );
      }
      withdrawAccounts.push({
        stakeAddress: stakeAccountAddress,
        voteAddress: voteAccountAddress,
        poolAmount,
      });
    } else {
      // Get the list of accounts to withdraw from
      withdrawAccounts.push(
        ...(await prepareWithdrawAccounts(
          STAKE_POOL_PROGRAM_ID_SEGMENTED,
          connection,
          stakePool.account.data,
          stakePoolAddress,
          poolAmount,
          validatorComparator,
          poolTokenAccount.equals(stakePool.account.data.managerFeeAccount),
        )),
      );
    }
  
    // Construct transaction to withdraw from withdrawAccounts account list
    const instructions: TransactionInstruction[] = [];
    const userTransferAuthority = Keypair.generate();
  
    const signers: Signer[] = [userTransferAuthority];
  
    instructions.push(
      createApproveInstruction(
        poolTokenAccount,
        userTransferAuthority.publicKey,
        tokenOwner,
        poolAmount,
      ),
    );
  
    let totalRentFreeBalances = 0;
  
    // Max 5 accounts to prevent an error: "Transaction too large"
    const maxWithdrawAccounts = 5;
    let i = 0;
  
    // Go through prepared accounts and withdraw/claim them
    for (const withdrawAccount of withdrawAccounts) {
      if (i > maxWithdrawAccounts) {
        break;
      }
      // Convert pool tokens amount to lamports
      const solWithdrawAmount = Math.ceil(
        calcLamportsWithdrawAmount(stakePool.account.data, withdrawAccount.poolAmount),
      );
  
      let infoMsg = `Withdrawing ◎${solWithdrawAmount},
        from stake account ${withdrawAccount.stakeAddress?.toBase58()}`;
  
      if (withdrawAccount.voteAddress) {
        infoMsg = `${infoMsg}, delegated to ${withdrawAccount.voteAddress?.toBase58()}`;
      }
  
      console.info(infoMsg);
      let stakeToReceive;
  
      if (!stakeReceiver || (stakeReceiverAccount && stakeReceiverAccount.type === 'delegated')) {
        const stakeKeypair = newStakeAccount(tokenOwner, instructions, stakeAccountRentExemption);
        signers.push(stakeKeypair);
        totalRentFreeBalances += stakeAccountRentExemption;
        stakeToReceive = stakeKeypair.publicKey;
      } else {
        stakeToReceive = stakeReceiver;
      }
      const withdrawStake = StakePoolInstruction.withdrawStake({
        stakePool: stakePoolAddress,
        validatorList: stakePool.account.data.validatorList,
        validatorStake: withdrawAccount.stakeAddress,
        destinationStake: stakeToReceive,
        destinationStakeAuthority: tokenOwner,
        sourceTransferAuthority: userTransferAuthority.publicKey,
        sourcePoolAccount: poolTokenAccount,
        managerFeeAccount: stakePool.account.data.managerFeeAccount,
        poolMint: stakePool.account.data.poolMint,
        poolTokens: withdrawAccount.poolAmount,
        withdrawAuthority,
      })
      withdrawStake.programId = STAKE_POOL_PROGRAM_ID_SEGMENTED;
      instructions.push(
        withdrawStake
      );
      i++;
    }
    if (stakeReceiver && stakeReceiverAccount && stakeReceiverAccount.type === 'delegated') {
      signers.forEach((newStakeKeypair) => {
        instructions.concat(
          StakeProgram.merge({
            stakePubkey: stakeReceiver,
            sourceStakePubKey: newStakeKeypair.publicKey,
            authorizedPubkey: tokenOwner,
          }).instructions,
        );
      });
    }
  
    return {
      instructions,
      signers,
      stakeReceiver,
      totalRentFreeBalances,
    };
  }