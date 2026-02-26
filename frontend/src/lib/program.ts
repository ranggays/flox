import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./idl/locketing_contract.json";

type LocketingProgram = Program<any>;

export const PROGRAM_ID = new PublicKey(
  "647HoEVTSQenPoE1XxuyCNL9JGks1h3Y66WkVWBJm1GM"
);

export const REQUIRED_STAKE = 50_000_000;

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(
    { ...idl, address: PROGRAM_ID.toBase58() } as Idl,
    provider
  );
}

// PDA Helpers
export function getEscrowPDA(organizer: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function getEventPDA(organizer: PublicKey, eventId: number): PublicKey {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(eventId), true);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), organizer.toBuffer(), new Uint8Array(buf)],
    PROGRAM_ID
  )[0];
}

export function getTierPDA(eventPDA: PublicKey, tierIndex: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tier"), eventPDA.toBuffer(), Buffer.from([tierIndex])],
    PROGRAM_ID
  )[0];
}

export function getTicketPDA(eventPDA: PublicKey, tokenId: number): PublicKey {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(tokenId), true);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ticket"), eventPDA.toBuffer(), new Uint8Array(buf)],
    PROGRAM_ID
  )[0];
}

export function getValidatorPDA(
  eventPDA: PublicKey,
  validatorPubkey: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("validator"), eventPDA.toBuffer(), validatorPubkey.toBuffer()],
    PROGRAM_ID
  )[0];
}

// Instruction Helpers
export async function initializeEscrow(
  program: LocketingProgram,
  organizer: PublicKey
) {
  const escrowPDA = getEscrowPDA(organizer);
  return (program.methods as any)
    .initializeEscrow()
    .accounts({
      escrowAccount: escrowPDA,
      organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function stakeForEvent(
  program: LocketingProgram,
  organizer: PublicKey
) {
  const escrowPDA = getEscrowPDA(organizer);
  return (program.methods as any)
    .stakeForEvent()
    .accounts({
      escrowAccount: escrowPDA,
      organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function createEvent(
  program: LocketingProgram,
  organizer: PublicKey,
  params: {
    eventId: number;
    name: string;
    description: string;
    category: object;
    eventType: object;
    location: string;
    startTime: number; // Unix timestamp (detik)
    endTime: number;   // Unix timestamp (detik)
    imageUri: string;
    metadataUri: string;
  }
) {
  const escrowPDA = getEscrowPDA(organizer);
  const eventPDA = getEventPDA(organizer, params.eventId);

  return (program.methods as any)
    .createEvent(
      new BN(params.eventId),
      params.name,
      params.description,
      params.category,
      params.eventType,
      params.location,
      new BN(params.startTime),
      new BN(params.endTime),
      params.imageUri,
      params.metadataUri
    )
    .accounts({
      eventAccount: eventPDA,
      escrowAccount: escrowPDA,
      organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function addTicketTier(
  program: LocketingProgram,
  organizer: PublicKey,
  eventPDA: PublicKey,
  tier: {
    tierIndex: number;
    name: string;
    priceSol: string;  
    maxSupply: number;
  }
) {
  const tierPDA = getTierPDA(eventPDA, tier.tierIndex);
  const priceLamports = new BN(
    Math.round(parseFloat(tier.priceSol) * LAMPORTS_PER_SOL)
  );

  return (program.methods as any)
    .addTicketTier(tier.tierIndex, tier.name, priceLamports, tier.maxSupply)
    .accounts({
      eventAccount: eventPDA,
      tierAccount: tierPDA,
      organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function mintTicket(
  program: LocketingProgram,
  buyer: PublicKey,
  eventPDA: PublicKey,
  tierPDA: PublicKey,
  escrowPDA: PublicKey,
  tokenId: number
) {
  const ticketPDA = getTicketPDA(eventPDA, tokenId);

  return (program.methods as any)
    .mintTicket(new BN(tokenId))
    .accounts({
      eventAccount: eventPDA,
      tierAccount: tierPDA,
      escrowAccount: escrowPDA,
      ticketAccount: ticketPDA,
      buyer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function addValidator(
  program: LocketingProgram,
  organizer: PublicKey,
  eventPDA: PublicKey,
  validatorPubkey: PublicKey
) {
  const validatorPDA = getValidatorPDA(eventPDA, validatorPubkey);

  return (program.methods as any)
    .addValidator(validatorPubkey)
    .accounts({
      eventAccount: eventPDA,
      validatorAccount: validatorPDA,
      organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function validateTicket(
  program: LocketingProgram,
  validator: PublicKey,
  validatorPDA: PublicKey,
  ticketPDA: PublicKey
) {
  return (program.methods as any)
    .validateTicket()
    .accounts({
      validatorAccount: validatorPDA,
      ticketAccount: ticketPDA,
      validator,
    })
    .rpc();
}

export async function withdrawFunds(
  program: LocketingProgram,
  organizer: PublicKey,
  eventPDA: PublicKey
) {
  const escrowPDA = getEscrowPDA(organizer);

  return (program.methods as any)
    .withdrawFunds()
    .accounts({
      eventAccount: eventPDA,
      escrowAccount: escrowPDA,
      organizer,
    })
    .rpc();
}

export async function cancelEvent(
  program: LocketingProgram,
  organizer: PublicKey,
  eventPDA: PublicKey
) {
  const escrowPDA = getEscrowPDA(organizer);

  return (program.methods as any)
    .cancelEvent()
    .accounts({
      eventAccount: eventPDA,
      escrowAccount: escrowPDA,
      organizer,
    })
    .rpc();
}

export async function claimRefund(
  program: LocketingProgram,
  buyer: PublicKey,
  eventPDA: PublicKey,
  tierPDA: PublicKey,
  escrowPDA: PublicKey,
  ticketPDA: PublicKey
) {
  return (program.methods as any)
    .claimRefund()
    .accounts({
      eventAccount: eventPDA,
      tierAccount: tierPDA,
      escrowAccount: escrowPDA,
      ticketAccount: ticketPDA,
      buyer: buyer,
    })
    .rpc();
}

// Read Helpers
export async function fetchEscrow(
  program: LocketingProgram,
  organizer: PublicKey
) {
  const escrowPDA = getEscrowPDA(organizer);
  try {
    return await (program.account as any).escrowAccount.fetch(escrowPDA);
  } catch {
    return null;
  }
}

export async function fetchOrganizerEvents(
  program: LocketingProgram,
  organizer: PublicKey
) {
  return (program.account as any).eventAccount.all([
    { memcmp: { offset: 8, bytes: organizer.toBase58() } },
  ]);
}

export async function fetchEventTiers(
  program: LocketingProgram,
  eventPDA: PublicKey
) {
  return (program.account as any).ticketTierAccount.all([
    { memcmp: { offset: 8, bytes: eventPDA.toBase58() } },
  ]);
}

export async function fetchOwnerTickets(
  program: LocketingProgram,
  owner: PublicKey
) {
  return (program.account as any).ticketNftAccount.all([
    { memcmp: { offset: 72, bytes: owner.toBase58() } },
  ]);
}

export async function fetchEventValidators(
  program: LocketingProgram,
  eventPDA: PublicKey
) {
  return (program.account as any).validatorAccount.all([
    { memcmp: { offset: 8, bytes: eventPDA.toBase58() } },
  ]);
}