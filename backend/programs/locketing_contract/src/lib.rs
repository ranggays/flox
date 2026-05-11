use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("647HoEVTSQenPoE1XxuyCNL9JGks1h3Y66WkVWBJm1GM");

#[program]
pub mod locketing_contract {
    use super::*;

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.organizer = ctx.accounts.organizer.key();
        escrow.locked_amount = 0;
        escrow.available_amount = 0;
        escrow.event_count = 0;
        escrow.bump = ctx.bumps.escrow_account;
        Ok(())
    }

    pub fn stake_for_event(ctx: Context<StakeForEvent>) -> Result<()> {
        let stake_amount: u64 = 50_000_000; 
        let transfer_instruction = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.organizer.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
            },
        );
        system_program::transfer(transfer_instruction, stake_amount)?;

        let escrow = &mut ctx.accounts.escrow_account;
        escrow.locked_amount = escrow.locked_amount.checked_add(stake_amount).unwrap();
        Ok(())
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: u64,
        name: String,
        description: String,
        category: Category,
        event_type: EventType,
        location: String,
        start_time: i64,
        end_time: i64,
        image_uri: String,
        metadata_uri: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.locked_amount >= 50_000_000, CustomError::NotStaked);

        let event = &mut ctx.accounts.event_account;
        event.organizer = ctx.accounts.organizer.key();
        event.event_id = event_id;
        event.name = name;
        event.description = description;
        event.category = category;
        event.event_type = event_type;
        event.location = location;
        event.start_time = start_time;
        event.end_time = end_time;
        event.image_uri = image_uri;
        event.metadata_uri = metadata_uri;
        event.status = EventStatus::Active;
        event.total_revenue = 0;
        event.tickets_sold = 0;
        event.tier_count = 0;
        event.bump = ctx.bumps.event_account;

        escrow.event_count = escrow.event_count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn add_ticket_tier(
        ctx: Context<AddTicketTier>,
        tier_index: u8, 
        name: String,
        price: u64,
        max_supply: u32,
    ) -> Result<()> {
        let tier = &mut ctx.accounts.tier_account;
        tier.event = ctx.accounts.event_account.key();
        tier.tier_index = tier_index;
        tier.name = name;
        tier.price = price;
        tier.max_supply = max_supply;
        tier.sold = 0;
        tier.is_active = true;
        tier.bump = ctx.bumps.tier_account;

        let event = &mut ctx.accounts.event_account;
        event.tier_count = event.tier_count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn mint_ticket(ctx: Context<MintTicket>, token_id: u64) -> Result<()> {
        let tier = &mut ctx.accounts.tier_account;
        let event = &mut ctx.accounts.event_account;
        
        require!(event.status == EventStatus::Active, CustomError::EventNotActive);
        require!(tier.sold < tier.max_supply, CustomError::SoldOut);

        let transfer_instruction = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
            },
        );
        system_program::transfer(transfer_instruction, tier.price)?;

        let escrow = &mut ctx.accounts.escrow_account;
        escrow.available_amount = escrow.available_amount.checked_add(tier.price).unwrap();
        
        tier.sold = tier.sold.checked_add(1).unwrap();
        event.tickets_sold = event.tickets_sold.checked_add(1).unwrap();
        event.total_revenue = event.total_revenue.checked_add(tier.price).unwrap();

        let ticket = &mut ctx.accounts.ticket_account;
        ticket.event = event.key();
        ticket.tier = tier.key();
        ticket.owner = ctx.accounts.buyer.key();
        ticket.token_id = token_id;
        ticket.is_used = false;
        ticket.purchased_at = Clock::get()?.unix_timestamp;
        ticket.bump = ctx.bumps.ticket_account;
        Ok(())
    }

    pub fn add_validator(ctx: Context<AddValidator>, validator_pubkey: Pubkey) -> Result<()> {
        let validator = &mut ctx.accounts.validator_account;
        validator.event = ctx.accounts.event_account.key();
        validator.validator = validator_pubkey;
        validator.added_by = ctx.accounts.organizer.key();
        validator.created_at = Clock::get()?.unix_timestamp;
        validator.is_active = true;
        validator.bump = ctx.bumps.validator_account;
        Ok(())
    }

    pub fn validate_ticket(ctx: Context<ValidateTicket>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket_account;
        let validator = &ctx.accounts.validator_account;
        require!(validator.is_active, CustomError::ValidatorNotActive);
        require!(!ticket.is_used, CustomError::TicketAlreadyUsed);
        ticket.is_used = true;
        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let event = &mut ctx.accounts.event_account;
        let escrow = &mut ctx.accounts.escrow_account;
        let current_time = Clock::get()?.unix_timestamp;

        require!(current_time > event.end_time, CustomError::EventNotEnded);
        require!(event.status == EventStatus::Active, CustomError::EventNotActive);

        let stake_amount: u64 = 50_000_000;
        let revenue_to_withdraw = event.total_revenue;
        let total_payout = revenue_to_withdraw.checked_add(stake_amount).unwrap();

        require!(escrow.to_account_info().lamports() >= total_payout, CustomError::InsufficientEscrow);

        escrow.available_amount = escrow.available_amount.checked_sub(revenue_to_withdraw).unwrap();
        escrow.locked_amount = escrow.locked_amount.checked_sub(stake_amount).unwrap();
        
        **escrow.to_account_info().try_borrow_mut_lamports()? -= total_payout;
        **ctx.accounts.organizer.to_account_info().try_borrow_mut_lamports()? += total_payout;

        event.status = EventStatus::Ended;

        msg!("Pencairan Sukses! Modal 0.05 SOL dan keuntungan tiket telah dikirim.");
        Ok(())
    }

    pub fn cancel_event(ctx: Context<CancelEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event_account;
        let escrow = &mut ctx.accounts.escrow_account;
        
        require!(event.status == EventStatus::Active, CustomError::EventNotActive);

        let stake_penalty: u64 = 50_000_000; 
        escrow.locked_amount = escrow.locked_amount.checked_sub(stake_penalty).unwrap();
        
        event.status = EventStatus::Cancelled;

        msg!("Acara Dibatalkan! Uang jaminan 0.05 SOL telah dihanguskan.");
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let event = &ctx.accounts.event_account;
        let escrow = &mut ctx.accounts.escrow_account;
        let tier = &ctx.accounts.tier_account;

        require!(event.status == EventStatus::Cancelled, CustomError::EventNotCancelled);

        let refund_amount = tier.price;

        require!(escrow.to_account_info().lamports() >= refund_amount, CustomError::InsufficientEscrow);

        **escrow.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        escrow.available_amount = escrow.available_amount.checked_sub(refund_amount).unwrap();

        msg!("Refund sukses! Uang tiket dikembalikan dan tiket dihanguskan.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(init, payer = organizer, space = 8 + 32 + 8 + 8 + 1 + 1, seeds = [b"escrow", organizer.key().as_ref()], bump)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeForEvent<'info> {
    #[account(mut, has_one = organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct CreateEvent<'info> {
    #[account(init, payer = organizer, space = 8 + 32 + 8 + 104 + 508 + 1 + 1 + 204 + 8 + 8 + 104 + 104 + 1 + 8 + 4 + 1 + 1, seeds = [b"event", organizer.key().as_ref(), &event_id.to_le_bytes()], bump)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut, has_one = organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_index: u8)]
pub struct AddTicketTier<'info> {
    #[account(mut, has_one = organizer)]
    pub event_account: Account<'info, EventAccount>,
    #[account(init, payer = organizer, space = 8 + 32 + 1 + 54 + 8 + 4 + 4 + 1 + 1, seeds = [b"tier", event_account.key().as_ref(), &[tier_index]], bump)]
    pub tier_account: Account<'info, TicketTierAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_id: u64)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut, constraint = tier_account.event == event_account.key())]
    pub tier_account: Account<'info, TicketTierAccount>,
    #[account(mut, constraint = escrow_account.organizer == event_account.organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(init, payer = buyer, space = 8 + 32 + 32 + 32 + 8 + 1 + 8 + 1, seeds = [b"ticket", event_account.key().as_ref(), &token_id.to_le_bytes()], bump)]
    pub ticket_account: Account<'info, TicketNFTAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(validator_pubkey: Pubkey)]
pub struct AddValidator<'info> {
    #[account(has_one = organizer)]
    pub event_account: Account<'info, EventAccount>,
    #[account(init, payer = organizer, space = 8 + 32 + 32 + 32 + 8 + 1 + 1, seeds = [b"validator", event_account.key().as_ref(), validator_pubkey.as_ref()], bump)]
    pub validator_account: Account<'info, ValidatorAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateTicket<'info> {
    #[account(has_one = validator)]
    pub validator_account: Account<'info, ValidatorAccount>,
    #[account(mut, constraint = ticket_account.event == validator_account.event)]
    pub ticket_account: Account<'info, TicketNFTAccount>,
    #[account(mut)]
    pub validator: Signer<'info>, 
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, has_one = organizer)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut, has_one = organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelEvent<'info> {
    #[account(mut, has_one = organizer)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut, has_one = organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub organizer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    pub event_account: Account<'info, EventAccount>,
    #[account(constraint = tier_account.event == event_account.key())]
    pub tier_account: Account<'info, TicketTierAccount>,
    #[account(mut, constraint = escrow_account.organizer == event_account.organizer)]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        mut, 
        close = buyer, 
        constraint = ticket_account.event == event_account.key(),
        constraint = ticket_account.tier == tier_account.key(),
        constraint = ticket_account.owner == buyer.key()
    )]
    pub ticket_account: Account<'info, TicketNFTAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EventStatus { Active, Cancelled, Ended }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Category { Music, Conference, Sports, Art, Hackathon, Workshop, Other }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EventType { Physical, Virtual }

#[account] pub struct EscrowAccount { 
    pub organizer: Pubkey, 
    pub locked_amount: u64, 
    pub available_amount: u64, 
    pub event_count: u8, 
    pub bump: u8, }

#[account] pub struct EventAccount { 
    pub organizer: Pubkey, 
    pub event_id: u64, 
    pub name: String, 
    pub description: String, 
    pub category: Category, 
    pub event_type: EventType, 
    pub location: String, 
    pub start_time: i64, 
    pub end_time: i64, 
    pub image_uri: String, 
    pub metadata_uri: String, 
    pub status: EventStatus, 
    pub total_revenue: u64, 
    pub tickets_sold: u32, 
    pub tier_count: u8, 
    pub bump: u8, }
    
#[account] pub struct TicketTierAccount { 
    pub event: Pubkey, 
    pub tier_index: u8, 
    pub name: String, 
    pub price: u64, 
    pub max_supply: u32, 
    pub sold: u32, 
    pub is_active: bool, 
    pub bump: u8, }

#[account] pub struct TicketNFTAccount { 
    pub event: Pubkey, 
    pub tier: Pubkey, 
    pub owner: Pubkey, 
    pub token_id: u64, 
    pub is_used: bool, 
    pub purchased_at: i64, 
    pub bump: u8, }

#[account] pub struct ValidatorAccount { 
    pub event: Pubkey, 
    pub validator: Pubkey, 
    pub added_by: Pubkey, 
    pub created_at: i64, 
    pub is_active: bool, 
    pub bump: u8, }

#[error_code]
pub enum CustomError {
    #[msg("Organizer harus mengunci Stake 0.05 SOL terlebih dahulu!")]
    NotStaked,
    #[msg("Event sudah tidak aktif atau dibatalkan.")]
    EventNotActive,
    #[msg("Maaf, tiket untuk tier ini sudah habis (Sold Out)!")]
    SoldOut,
    #[msg("Satpam ini tidak aktif atau tidak berwenang!")]
    ValidatorNotActive,
    #[msg("Tiket ini sudah di-scan sebelumnya (Hangus)!")]
    TicketAlreadyUsed,
    #[msg("Acara belum selesai! Dana masih dikunci.")]
    EventNotEnded,
    #[msg("Saldo di Escrow tidak mencukupi untuk penarikan ini.")]
    InsufficientEscrow,
    #[msg("Hanya bisa refund untuk event yang dibatalkan")]
    EventNotCancelled,
}