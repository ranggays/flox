# Hello Everyone, I am Ray and this is my first project for hackaton (so still a new in this field)

# Flox — User Guide

> Flox is a secure, transparent, and intermediary-free event ticketing platform built on the Solana blockchain.

---

## Table of Contents

1. [What is Flox?](#1-what-is-flox)
2. [How is it Different from Regular Ticketing Platforms?](#2-how-is-it-different-from-regular-ticketing-platforms)
3. [Key Terms You Should Know](#3-key-terms-you-should-know)
4. [Getting Started](#4-getting-started)
5. [Guide for Ticket Buyers](#5-guide-for-ticket-buyers)
6. [Guide for Event Organizers](#6-guide-for-event-organizers)
7. [Guide for Validators](#7-guide-for-validators)
8. [AI Assistant Feature](#8-ai-assistant-feature)
9. [Frequently Asked Questions](#9-frequently-asked-questions)
10. [Security & How We Protect You](#10-security--how-we-protect-you)

---

## 1. What is Flox?

Flox is an event ticketing platform built on **Solana** — a blockchain network that allows transactions to happen directly between event organizers and buyers, **without any middlemen like banks or ticketing companies**.

Think of it this way: when you buy a concert ticket normally, your money passes through several parties (payment gateways, ticketing companies, etc.) before reaching the organizer. On Flox, money moves directly from your digital wallet into an automated system managed by the organizer — **transparent, instant, and permanently recorded**.

### What can you do on Flox?

| Role | What You Can Do |
|---|---|
| 💵 Buyer | Browse events, buy tickets, manage your digital ticket collection |
| 🎪 Organizer | Create events, set ticket prices, receive payments, manage validators |
| ✅ Validator | Scan and verify tickets on-site at events |
| 👤 Everyone | Chat with the AI assistant for real-time event information |

---

## 2. How is it Different from Regular Ticketing Platforms?

### ✅ Advantages of Flox

**No hidden middleman fees**
Conventional ticketing platforms typically cut 10–25% of the ticket price as a service fee. On Flox, you only pay Solana's network transaction fee, which is extremely small — usually less than $0.01.

**Tickets cannot be faked**
Every ticket is a unique record stored on the blockchain. Nobody can duplicate or counterfeit a ticket because each one has a unique cryptographic identity that can be verified at any time.

**Buyer funds are protected**
Ticket payments don't go directly to the organizer — the money is held in an **escrow** system (an automated holding account) on the blockchain. Organizers can only withdraw funds after the event concludes.

**Fully transparent and auditable**
All transactions are recorded on the blockchain and visible to anyone. Organizers cannot manipulate sales data.

**Organizers must be committed**
To create an event, organizers must deposit a 0.05 SOL stake as a guarantee. This prevents spam events and deters bad actors.

### ⚠️ Things to Keep in Mind

- You need a **crypto wallet** (Phantom Wallet) to use this platform
- Payments are made in **SOL** (Solana's cryptocurrency), not fiat currency
- Flox currently runs on a **test network (Devnet)** — the SOL used is test SOL with no real monetary value

---

## 3. Key Terms You Should Know

| Term | Simple Explanation |
|---|---|
| **Blockchain** | A digital ledger distributed across thousands of computers. Data on it cannot be altered or deleted by anyone |
| **Solana** | The blockchain network used by Flox. Known for fast transactions and very low fees |
| **SOL** | The digital currency on the Solana network — like "coins" for paying within the Solana ecosystem |
| **Wallet / Digital Wallet** | An app that stores your SOL and your digital identity. Flox uses Phantom Wallet |
| **Phantom Wallet** | A browser extension (like a plugin) that acts as your digital wallet |
| **Devnet** | Solana's test network. SOL here is free and has no real monetary value — used for testing |
| **Escrow** | An automated holding account. Buyer payments go here and organizers can only withdraw after the event ends |
| **Stake / Deposit** | An amount of SOL "locked" temporarily as a guarantee of the organizer's commitment. Returned after the event ends |
| **Ticket Tier** | A ticket category with its own price. Example: VIP (0.5 SOL), Regular (0.1 SOL) |
| **PDA** | How the blockchain uniquely stores data — every ticket is a unique PDA that cannot be duplicated |
| **Validator** | A person authorized by the organizer to verify tickets at the event venue using QR code scanning |
| **QR Code** | A square barcode containing ticket information, scanned by validators at the event entrance |

---

## 4. Getting Started

### Step 1 — Install Phantom Wallet

1. Open Chrome or Firefox
2. Visit **phantom.app**
3. Click **"Add to Chrome"** or **"Add to Firefox"**
4. Follow the setup process — you will receive a **Seed Phrase** (12 secret words)

> ⚠️ **IMPORTANT:** Write your Seed Phrase on paper and store it somewhere safe. Never save it in photos or digital notes. This is the only way to recover your wallet if your device is lost or broken.

### Step 2 — Switch to Devnet

Since Flox currently runs on the test network:

1. Open Phantom Wallet (click the icon in the top-right corner of your browser)
2. Click the gear icon ⚙️ (Settings)
3. Select **"Developer Settings"**
4. Enable **"Testnet Mode"** or select **"Devnet"**

### Step 3 — Get Free Test SOL

1. Visit **faucet.solana.com**
2. Paste your wallet address (click your wallet name in Phantom to copy it)
3. Select **Devnet**
4. Click **"Request Airdrop"**
5. Wait a few seconds — SOL will appear in your wallet

### Step 4 — Connect Your Wallet to Flox

1. Open Flox in your browser
2. Click **"Connect Wallet"** in the top-right corner
3. Select **Phantom**
4. Click **"Connect"** in the Phantom popup

If successful, your wallet address will appear in the header.

---

## 5. Guide for Ticket Buyers

### Finding Events

On the homepage, you can browse all available events. You can:

- **Filter by category:** Music, Conference, Sports, Art, or Other
- **Search by name or location** using the search bar
- Check event status: **On Sale** (currently selling), **Upcoming** (not started yet), **Ended** (event has passed)

### Buying a Ticket

1. Click on an event you're interested in
2. On the event detail page, scroll to the **"Get Your Tickets"** section
3. Choose the ticket tier you want (e.g. VIP or Regular)
4. Review the tier details:
   - Price in SOL
   - Remaining tickets available
   - Special badges (e.g. "Exclusive" for the top tier)
5. Click the **"Buy"** button
6. A Phantom popup will appear — review the transaction details:
   - How much SOL will be spent
   - The program address receiving the payment
7. Click **"Confirm"** in Phantom
8. Wait for confirmation (usually 1–3 seconds)
9. Your ticket is automatically saved to your wallet

### Viewing Your Tickets

1. Click **"My Tickets"** in the header
2. All tickets you've purchased will be listed
3. Ticket statuses:
   - 🟢 **Upcoming** — event hasn't started yet, ticket is valid
   - ✅ **Attended** — ticket has been validated or the event has ended

### Using Your Ticket at an Event

When you arrive at the event venue:
1. Open the **"My Tickets"** page
2. Show your ticket's QR code to the validator staff
3. The validator will scan your QR code using their wallet
4. Once verified, your ticket status changes to **"Attended"**

> 💡 A scanned ticket cannot be used again. This prevents tickets from being used more than once.

---

## 6. Guide for Event Organizers

### Requirements to Become an Organizer

- A Phantom Wallet connected to Devnet
- At least **0.1 SOL** in your wallet (0.05 for the stake deposit + a little for transaction fees)

### Accessing the Organizer Dashboard

Click **"Dashboard"** in the navigation header. Here you can see:
- Total revenue from all your events
- Total tickets sold
- Your escrow stake status
- A list of all events you've created

### Creating a New Event

Click **"Create Event"** in the dashboard, then fill out 5 sections:

#### Section 1 — General Information
| Field | Description |
|---|---|
| Event Name | Full name of your event (displayed across all pages) |
| Description | Tell attendees about your event, speakers, agenda, etc. |
| Category | Choose: Music, Conference, Workshop, Hackathon, Sports, Art, or Other |

#### Section 2 — Logistics
| Field | Description |
|---|---|
| Event Type | Physical (in-person) or Virtual (online) |
| Location | For Physical: venue name & address. For Virtual: meeting link |
| Start Date | When the event begins |
| End Date | When the event ends |

#### Section 3 — Ticketing & Supply

You can create multiple ticket tiers with different prices:

| Field | Description |
|---|---|
| Tier Name | e.g. "VIP", "Regular", "Early Bird" |
| Price (SOL) | Ticket price in SOL (e.g. 0.5 means 0.5 SOL) |
| Supply | Maximum number of tickets available for this tier |

Click **"Add Tier"** to add more tiers, or remove ones you don't need.

> 💡 **Tip:** The first tier (index 0) gets a special "Exclusive" badge on the event page.

#### Section 4 — Event Media

Upload a banner image for your event:
- Click the upload area or drag and drop an image file
- Supported formats: JPG, PNG, WebP
- Ideal size: 1200×630 pixels
- Maximum file size: 5MB
- The image is uploaded to cloud storage before being saved to the blockchain

#### Section 5 — Anti-Spam Stake

This is the final step before deploying:

1. Click **"Stake & Authorize"**
2. Phantom will ask for approval to transfer **0.05 SOL**
3. This SOL is locked as proof that your event is legitimate
4. Click **"Confirm"** in Phantom
5. Wait for confirmation
6. Once done, the **"Deploy Smart Contract"** button becomes active

#### Deploying Your Event

Click **"Deploy Smart Contract & Create Event"**. The following happens automatically:
1. 📤 Banner image is uploaded to cloud storage (if provided)
2. ⛓️ Event is registered on the blockchain (1 transaction)
3. 🎟️ Each ticket tier is created on the blockchain (1 transaction per tier)

Once complete, your event immediately appears on the homepage and is ready for ticket sales!

### Managing Existing Events

In the dashboard, the **"Manage Events"** table shows all your events with action buttons:

#### Cancel Event
- Available for events with **Active** or **Upcoming** status
- Locks the event — no new tickets can be sold
- A confirmation dialog will appear before the action proceeds
- ⚠️ Automatic refunds to buyers are not yet available (feature in development)

#### Withdraw Funds
- Available after the event has **Ended** (the event's end time has passed)
- Transfers all ticket sales revenue to your wallet
- Also returns your 0.05 SOL stake deposit
- After a successful withdrawal, the button changes to a **"✓ Withdrawn"** badge and is permanently disabled

### Adding Validators

At the bottom of the dashboard, the **"Event Validators"** table lets you manage on-site verifiers:

1. Select an event from the dropdown
2. Enter the **wallet address** of the person you want to authorize as a validator
3. Click **"Add"**
4. Phantom will ask for transaction approval
5. That wallet is now officially authorized to validate tickets for that event

> 💡 You can add multiple validators to a single event — useful for events with multiple entrances or check-in stations.

---

## 7. Guide for Validators

Validators are trusted individuals authorized by an organizer to verify attendee tickets at the event venue.

### Requirements

- A Phantom Wallet
- Your wallet address must be registered by the organizer in their dashboard
- A small amount of SOL to cover the transaction fee when validating

### How to Validate a Ticket

1. Ask the attendee to open their ticket on the **"My Tickets"** page
2. Scan the QR code displayed on their ticket
3. The QR code contains the on-chain address of their ticket
4. Complete the validation transaction using your wallet
5. If successful, the attendee's ticket status changes to **"Attended"**

---

## 8. AI Assistant Feature

On every page, there's a purple **✨** button in the bottom-right corner — that's Flox's AI assistant, powered by **Google Gemini**.

### What You Can Ask

**About Events:**
- "What events are available this week?"
- "Are there any music events?"
- "How much does a ticket cost for DevConf 2026?"
- "Which events still have tickets available?"

**About the Platform:**
- "How do I buy a ticket?"
- "What is the escrow system?"
- "Why do organizers need to stake before creating an event?"

**About Your Personal Data** (if your wallet is connected and you've visited the relevant page):
- "How many tickets have I bought?"
- "What's the status of my ticket for event X?"
- "What is my total event revenue?" (organizers only)

### Preferences Tab

Click the **"Preferences"** tab inside the AI widget to customize:

| Setting | Options |
|---|---|
| Favorite Categories | Select event categories you prefer so the AI gives more relevant suggestions |
| Event Format | All / Physical / Virtual |
| AI Language | English / Bahasa Indonesia |

### Moving the Widget

The AI widget can be **dragged** to any position on your screen:
- Hold the left mouse button on the ✨ button
- Drag it to your preferred position
- Release the mouse

---

## 9. Frequently Asked Questions

**Are my tickets safe if the Flox website goes down?**
Yes. Your tickets are stored on the Solana blockchain, not on Flox's servers. Even if the website is unreachable, your tickets will remain and can be verified directly on the blockchain.

**Can I transfer or resell my ticket to someone else?**
Currently, tickets are bound to the buyer's wallet. Ticket transfer and peer-to-peer resale features are not yet available.

**What happens if an event is cancelled?**
The organizer can cancel an event through their dashboard. The event status will change to "Cancelled." Automatic refunds are still under development — but buyers can click refund in their ticket section.

**How long does a payment take?**
Solana transactions typically complete in 1–3 seconds. This is significantly faster than bank transfers, which can take 1–2 business days.

**Can my SOL be stolen?**
As long as your Seed Phrase is kept safe and never shared with anyone, the SOL in your wallet cannot be stolen. Flox will never ask for your Seed Phrase.

**Why do I need to pay a "gas fee"?**
Every blockchain transaction requires a small fee called a "transaction fee" or "gas fee." On Solana, this fee is extremely small — usually less than $0.01.

**What if I accidentally start a purchase and want to cancel?**
Before any transaction is executed, Phantom Wallet always shows a confirmation popup. As long as you haven't clicked "Confirm" in Phantom, no SOL will leave your wallet.

**Do I need to register an account or complete KYC?**
No. Flox requires no registration or identity verification. Simply connect your wallet and you're ready to go.

**Where is the organizer's revenue stored?**
In a blockchain escrow account — not on Flox's servers. Revenue is secure and can only be withdrawn by the organizer who owns that wallet.

**Why do organizers need to stake 0.05 SOL?**
This is an anti-spam mechanism. The stake ensures organizers are serious and not creating throwaway events. The full amount is returned when the organizer withdraws after their event concludes.

---

## 10. Security & How We Protect You

### What Flox Will NEVER Do

- ❌ Ask for your Seed Phrase (12 secret words)
- ❌ Ask for your Phantom Wallet password
- ❌ Ask you to transfer SOL to an unknown address
- ❌ Send emails or DMs requesting sensitive information

### How to Identify the Real Website

Always verify that the URL in your browser matches Flox's official address. Be cautious of phishing websites with similar-looking names.

### Security Tips

1. **Guard your Seed Phrase** — write it on paper and store it in a secure location like a safe
2. **Use a dedicated wallet** — consider creating a separate wallet specifically for trying new platforms
3. **Always review transaction details** — before clicking Confirm in Phantom, read what the transaction is doing
4. **Use a secure network** — avoid public WiFi when making transactions
5. **Keep Phantom updated** — the latest version includes the best security protections

### If You Encounter a Problem

If you experience an issue or notice something suspicious:
- Do not proceed with any transactions until the issue is resolved
- Contact the Flox team through official channels
- Do not trust anyone who offers "help" via unsolicited DMs

---

*This guide was written for Flox v0.1.0 — Solana Devnet*  
*The platform is still under active development — features may change over time*