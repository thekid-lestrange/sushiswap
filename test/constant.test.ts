const INIT_CODE_HASH = "0x926c6bca5c0ebebd19fe393d3e0510704b322f32107df5ffe7919f50713a5c33"
import { bytecode } from '../artifacts/contracts/uniswapv2/UniswapV2Pair.sol/UniswapV2Pair.json'
import { keccak256 } from '@ethersproject/solidity'
import { expect } from "chai";
// this _could_ go in constants, except that it would cost every consumer of the sdk the CPU to compute the hash
// and load the JSON.
const COMPUTED_INIT_CODE_HASH = keccak256(['bytes'], [`${bytecode}`])

describe('constants', () => {
  describe('INIT_CODE_HASH', () => {
    it('matches computed bytecode hash', () => {
      expect(COMPUTED_INIT_CODE_HASH).to.equal(INIT_CODE_HASH)
    })
  })
})
