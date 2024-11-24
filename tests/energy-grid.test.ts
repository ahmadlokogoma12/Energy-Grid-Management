import { describe, it, expect, beforeEach } from 'vitest';

// Mock contract state
let gridBalance = 0;
let energyPrice = 100;
let nextTradeId = 0;
let prosumers = {};
let energyTrades = {};

// Mock contract owner
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

// Helper function to reset state before each test
function resetState() {
  gridBalance = 0;
  energyPrice = 100;
  nextTradeId = 0;
  prosumers = {};
  energyTrades = {};
}

// Mock contract functions
function registerProsumer(sender) {
  if (prosumers[sender]) {
    return { type: 'err', value: 104 }; // err-already-registered
  }
  prosumers[sender] = { energyBalance: 0, fundsBalance: 0 };
  return { type: 'ok', value: true };
}

function addEnergy(sender, amount) {
  if (!prosumers[sender]) {
    return { type: 'err', value: 102 }; // err-unauthorized
  }
  prosumers[sender].energyBalance += amount;
  gridBalance += amount;
  return { type: 'ok', value: true };
}

function consumeEnergy(sender, amount) {
  if (!prosumers[sender] || prosumers[sender].energyBalance < amount) {
    return { type: 'err', value: 103 }; // err-insufficient-energy
  }
  prosumers[sender].energyBalance -= amount;
  gridBalance -= amount;
  return { type: 'ok', value: true };
}

function setEnergyPrice(sender, newPrice) {
  if (sender !== contractOwner) {
    return { type: 'err', value: 100 }; // err-owner-only
  }
  energyPrice = newPrice;
  return { type: 'ok', value: true };
}

function tradeEnergy(sender, amount, price) {
  if (!prosumers[sender] || prosumers[sender].energyBalance < amount) {
    return { type: 'err', value: 103 }; // err-insufficient-energy
  }
  const tradeId = nextTradeId++;
  energyTrades[tradeId] = { seller: sender, buyer: sender, amount, price, status: 'open' };
  return { type: 'ok', value: tradeId };
}

function buyEnergy(sender, tradeId) {
  const trade = energyTrades[tradeId];
  if (!trade) {
    return { type: 'err', value: 105 }; // err-trade-not-found
  }
  if (trade.status !== 'open') {
    return { type: 'err', value: 106 }; // err-trade-not-open
  }
  if (sender === trade.seller) {
    return { type: 'err', value: 108 }; // err-self-trade
  }
  if (prosumers[sender].fundsBalance < trade.amount * trade.price) {
    return { type: 'err', value: 107 }; // err-insufficient-funds
  }
  
  const totalCost = trade.amount * trade.price;
  prosumers[trade.seller].energyBalance -= trade.amount;
  prosumers[trade.seller].fundsBalance += totalCost;
  prosumers[sender].energyBalance += trade.amount;
  prosumers[sender].fundsBalance -= totalCost;
  trade.buyer = sender;
  trade.status = 'completed';
  
  return { type: 'ok', value: true };
}

function addFunds(sender, amount) {
  if (!prosumers[sender]) {
    return { type: 'err', value: 102 }; // err-unauthorized
  }
  prosumers[sender].fundsBalance += amount;
  return { type: 'ok', value: true };
}

// Tests
describe('Decentralized Energy Grid Management', () => {
  beforeEach(() => {
    resetState();
  });
  
  it('allows prosumers to register, add energy, and consume energy', () => {
    const user1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    
    expect(registerProsumer(user1)).toEqual({ type: 'ok', value: true });
    expect(addEnergy(user1, 100)).toEqual({ type: 'ok', value: true });
    expect(consumeEnergy(user1, 50)).toEqual({ type: 'ok', value: true });
    
    expect(prosumers[user1].energyBalance).toBe(50);
    expect(gridBalance).toBe(50);
  });
  
  it('ensures energy trading works correctly', () => {
    const user1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const user2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    expect(registerProsumer(user1)).toEqual({ type: 'ok', value: true });
    expect(registerProsumer(user2)).toEqual({ type: 'ok', value: true });
    expect(addEnergy(user1, 100)).toEqual({ type: 'ok', value: true });
    expect(addFunds(user2, 10000)).toEqual({ type: 'ok', value: true });
    
    const tradeResult = tradeEnergy(user1, 50, 100);
    expect(tradeResult.type).toBe('ok');
    const tradeId = tradeResult.value;
    
    expect(buyEnergy(user2, tradeId)).toEqual({ type: 'ok', value: true });
    
    expect(prosumers[user1].energyBalance).toBe(50);
    expect(prosumers[user1].fundsBalance).toBe(5000);
    expect(prosumers[user2].energyBalance).toBe(50);
    expect(prosumers[user2].fundsBalance).toBe(5000);
  });
  
  it('ensures only the contract owner can set the energy price', () => {
    const user1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    
    expect(setEnergyPrice(contractOwner, 200)).toEqual({ type: 'ok', value: true });
    expect(setEnergyPrice(user1, 300)).toEqual({ type: 'err', value: 100 });
    expect(energyPrice).toBe(200);
  });
  
  it('ensures energy trading fails with proper error codes', () => {
    const user1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const user2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    expect(registerProsumer(user1)).toEqual({ type: 'ok', value: true });
    expect(registerProsumer(user2)).toEqual({ type: 'ok', value: true });
    expect(addEnergy(user1, 100)).toEqual({ type: 'ok', value: true });
    
    const tradeResult = tradeEnergy(user1, 50, 100);
    expect(tradeResult.type).toBe('ok');
    const tradeId = tradeResult.value;
    
    expect(buyEnergy(user2, 999)).toEqual({ type: 'err', value: 105 }); // Non-existent trade
    expect(buyEnergy(user2, tradeId)).toEqual({ type: 'err', value: 107 }); // Insufficient funds
    expect(buyEnergy(user1, tradeId)).toEqual({ type: 'err', value: 108 }); // Self-trade attempt
  });
});
