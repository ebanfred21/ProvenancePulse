# ProvenancePulse

A blockchain-powered platform for luxury goods that ensures ethical sourcing, transparent storytelling, and fair value distribution to creators and communities, built on the Stacks blockchain using Clarity smart contracts.

---

## Overview

ProvenancePulse tackles the lack of transparency in luxury goods’ sourcing and the disconnect between consumers and the artisans or communities behind them. By using blockchain, it verifies ethical practices (e.g., conflict-free diamonds, sustainable materials) and creates a digital narrative for each item, enhancing consumer trust and engagement. The platform also ensures artisans and local communities receive fair compensation through automated royalty systems. It consists of four smart contracts forming a decentralized, transparent ecosystem.

1. **Ethical NFT Contract** – Issues NFTs representing luxury items with embedded ethical sourcing and narrative metadata.
2. **Sourcing Journey Contract** – Tracks the ethical sourcing and production journey of luxury goods.
3. **Community Royalty Contract** – Automates royalty payments to artisans and sourcing communities on sales and resales.
4. **Storytelling Oracle Contract** – Integrates off-chain data (e.g., artisan interviews, sustainability certifications) to enrich item narratives.

---

## Features

- **NFT-based ethical certificates** tied to luxury goods, proving sustainable and fair sourcing.  
- **Transparent sourcing journey** from raw materials to finished product, viewable by consumers.  
- **Automated royalty payouts** for artisans and communities on initial and secondary sales.  
- **Rich storytelling** via oracles, linking items to artisan stories or environmental impact data.  
- **Decentralized marketplace integration** for verified, ethically sourced luxury goods trading.  

---

## Smart Contracts

### Ethical NFT Contract
- Mints NFTs for luxury items, embedding metadata (e.g., ethical certifications, artisan details, sustainability metrics).  
- Restricts NFT transfers to verified owners to prevent fraud.  
- Updates ownership and narrative metadata on-chain.  

### Sourcing Journey Contract
- Logs ethical sourcing milestones (e.g., conflict-free diamond mining, organic textile production, artisan crafting).  
- Restricts updates to authorized parties (e.g., certifiers, manufacturers, NGOs).  
- Provides public query functions for consumers to explore the item’s journey.  

### Community Royalty Contract
- Automates royalty payments to artisans and sourcing communities (e.g., 10% of primary and resale profits).  
- Tracks sales via NFT transfers for transparent revenue sharing.  
- Ensures fair distribution using on-chain records and smart contract logic.  

### Storytelling Oracle Contract
- Integrates off-chain data (e.g., artisan video interviews, sustainability reports) via secure oracles.  
- Validates ethical claims before NFT minting or sourcing updates.  
- Enriches NFT metadata with consumer-facing stories about the item’s impact.  

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started).  
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/provenancepulse.git
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Deploy contracts:
   ```bash
   clarinet deploy
   ```

## Usage

Each smart contract operates independently but integrates with others for a complete ethical sourcing and storytelling experience. Refer to individual contract documentation for function calls, parameters, and usage examples.

## License

MIT License

