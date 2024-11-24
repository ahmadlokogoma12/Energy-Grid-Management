# Decentralized Energy Grid Management Smart Contract

## Overview
This smart contract implements a decentralized energy trading platform that enables prosumers (producers/consumers) to participate in a local energy market. The system allows users to register, manage their energy production and consumption, and engage in peer-to-peer energy trading using cryptocurrency (microSTX) as the medium of exchange.

## Features
- Prosumer registration and management
- Energy addition and consumption tracking
- Peer-to-peer energy trading
- Built-in fund management system
- Grid-wide energy balance monitoring
- Dynamic energy pricing

## Smart Contract Functions

### Registration and Basic Operations
- `register-prosumer`: Register a new prosumer in the system
- `add-energy`: Add produced energy to prosumer's balance
- `consume-energy`: Deduct consumed energy from prosumer's balance
- `add-funds`: Add funds to prosumer's account for trading

### Trading Operations
- `trade-energy`: Create a new energy trade offer
- `buy-energy`: Purchase energy from an existing trade offer
- `set-energy-price`: Update the system-wide energy price (owner only)

### Read-Only Functions
- `get-energy-price`: Retrieve current energy price
- `get-grid-balance`: Get overall grid energy balance
- `get-prosumer-info`: Get account information for a specific prosumer
- `get-trade-info`: Retrieve details of a specific trade

## Error Codes
- `err-owner-only (u100)`: Operation restricted to contract owner
- `err-not-found (u101)`: Requested resource not found
- `err-unauthorized (u102)`: Unauthorized access attempt
- `err-insufficient-energy (u103)`: Insufficient energy balance
- `err-already-registered (u104)`: Prosumer already registered
- `err-trade-not-found (u105)`: Trade ID not found
- `err-trade-not-open (u106)`: Trade is not open for purchase
- `err-insufficient-funds (u107)`: Insufficient funds for transaction
- `err-self-trade (u108)`: Attempted self-trading

## Data Structures

### Prosumer
```clarity
{
  energy-balance: int,    // Current energy balance
  funds-balance: uint     // Available funds for trading
}
```

### Energy Trade
```clarity
{
  seller: principal,          // Address of energy seller
  buyer: principal,          // Address of energy buyer
  amount: uint,              // Amount of energy being traded
  price: uint,               // Price per unit of energy
  status: (string-ascii 20)  // Trade status (open/completed)
}
```

## Usage Example

1. Register as a prosumer:
```clarity
(contract-call? .energy-grid register-prosumer)
```

2. Add energy to your balance:
```clarity
(contract-call? .energy-grid add-energy u100)
```

3. Create a trade offer:
```clarity
(contract-call? .energy-grid trade-energy u50 u200)
```

4. Purchase energy from a trade:
```clarity
(contract-call? .energy-grid buy-energy u1)
```

## Implementation Notes

- Energy balances are tracked as integers to support both positive (production) and negative (consumption) values
- Funds are tracked as unsigned integers (uint) representing microSTX
- Trade IDs are automatically assigned and incremented
- The contract maintains a global grid balance to track overall energy flow
- Energy prices can be dynamically adjusted by the contract owner
- The system prevents self-trading to maintain market integrity

## Security Considerations

1. All critical operations include appropriate balance checks
2. Owner-only functions are properly restricted
3. Trade operations validate both energy and fund balances
4. Double-spending prevention through atomic transactions
5. Status tracking prevents invalid trade operations

## Contract Deployment
The contract requires initial deployment by an administrator who becomes the contract owner. The owner has special privileges for system management, such as setting energy prices.

## Integration
This smart contract can be integrated with:
- Web applications for energy trading
- IoT devices for automated energy management
- Monitoring systems for grid balance
- Payment systems using STX cryptocurrency
