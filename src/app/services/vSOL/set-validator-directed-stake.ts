// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { DirectedStake, directedStakeIdl } from "./directed-stake-idl"
// import {  PublicKey, TransactionInstruction } from "@solana/web3.js";

// // When given a wallet, lookup the director PDA
// const findDirectorAddress = (authority: PublicKey) => {
//     const [key] = PublicKey.findProgramAddressSync(
//         [new TextEncoder().encode('director'), authority.toBytes()],
//         new PublicKey(directedStakeIdl.address),
//     );
//     return key;
// };

// async function getDirected(program: Program<DirectedStake>, authority: PublicKey) {

//     const directorAddress = findDirectorAddress(authority);
//     const currentDirector = await program.account.director.fetchMultiple([directorAddress]);

//     return currentDirector[0]?.stakeTarget;
// }

// async function setDirectedInstructions(program: Program<DirectedStake>, authority: PublicKey, validatorVotePubKey: PublicKey): Promise<TransactionInstruction[]> {

//     const current = await getDirected(program, authority);

//     const ix = [];

//     if(!current) {
//         // Create first
//         const initDirectorIx = await program.methods
//             .initDirector()
//             .accounts({
//                 authority: authority,
//                 payer: authority,
//             })
//             .instruction();

//         ix.push(initDirectorIx);
        
//         const setDirectorIx = await program.methods
//             .setStakeTarget()
//             .accounts({
//                 authority: authority,
//                 stakeTarget: validatorVotePubKey,
//             })
//             .preInstructions([initDirectorIx])
//             .instruction();

//         ix.push(setDirectorIx);
//     } else {
//         // No init is needed
//         const setDirectorIx = await program.methods
//             .setStakeTarget()
//             .accounts({
//                 authority: authority,
//                 stakeTarget: validatorVotePubKey,
//             })
//             .instruction();

//         ix.push(setDirectorIx);
//     }

//     return ix;
// }

// async function closeDirected(program: Program<DirectedStake>, authority: PublicKey, validatorVotePubKey: PublicKey) {

//     await program.methods
//     .closeDirector()
//     .accounts({
//         authority: authority,
//         rentDestination: validatorVotePubKey,
//     })
//     .rpc();
// }


  
// export async function vSOLdirectStake(wallet, connection, validatorVoteAddress): Promise<TransactionInstruction[]> {

//     const provider = new anchor.AnchorProvider(connection, wallet);
//     anchor.setProvider(provider);

//     const directedStakeProgram = new Program<DirectedStake>(
//         directedStakeIdl as unknown as DirectedStake,
//         provider,
//     )


//     // Get which validator a specific wallet is directing to
//     // const current = await getDirected(directedStakeProgram, wallet.publicKey);
//     // console.log(`Validator directed to by wallet ${wallet.publicKey.toBase58()}: ${current ? current.toBase58() : 'NONE'}`);

//     // if(!current) {
//         // Set to Nordic Staking
//         const validatorVotePubKey = new PublicKey(validatorVoteAddress);
//         return await setDirectedInstructions(directedStakeProgram, wallet.publicKey, validatorVotePubKey);
//     // }
//     // console.log('finish vSOL direct stake');
    
// }



