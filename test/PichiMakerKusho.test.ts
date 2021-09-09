import { ethers } from "hardhat";
const { keccak256, defaultAbiCoder } = require("ethers");
import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("KushoPichiMaker", function () {
  before(async function () {
    await prepare(this, ["PichiMakerKusho", "PolyCityHall", "PichiMakerKushoExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair", "AntiqueBoxV1", "KushoPairMediumRiskV1", "PeggedOracleV1"])
  })

  beforeEach(async function () {
    // Deploy ERC20 Mocks and Factory
    await deploy(this, [
      ["pichi", this.ERC20Mock, ["PICHI", "PICHI", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    // Deploy Pichi and Kusho contracts
    await deploy(this, [["bar", this.PolyCityHall, [this.pichi.address]]])
    await deploy(this, [["antique", this.AntiqueBoxV1, [this.weth.address]]])
    await deploy(this, [["kushoMaster", this.KushoPairMediumRiskV1, [this.antique.address]]])
    await deploy(this, [["kushoMaker", this.PichiMakerKusho, [this.factory.address, this.bar.address, this.antique.address, this.pichi.address, this.weth.address, this.factory.pairCodeHash()]]])
    await deploy(this, [["exploiter", this.PichiMakerKushoExploitMock, [this.kushoMaker.address]]])
    await deploy(this, [["oracle", this.PeggedOracleV1]])
    // Create SLPs
    await createSLP(this, "pichiEth", this.pichi, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "pichiUSDC", this.pichi, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
    // Set Kusho fees to Maker
    await this.kushoMaster.setFeeTo(this.kushoMaker.address)
    // Whitelist Kusho on AntiqueBox
    await this.antique.whitelistMasterContract(this.kushoMaster.address, true)
    // Approve and make AntiqueBox token deposits
    await this.pichi.approve(this.antique.address, getBigNumber(10))
    await this.dai.approve(this.antique.address, getBigNumber(10))
    await this.mic.approve(this.antique.address, getBigNumber(10))
    await this.usdc.approve(this.antique.address, getBigNumber(10))
    await this.weth.approve(this.antique.address, getBigNumber(10))
    await this.strudel.approve(this.antique.address, getBigNumber(10))
    await this.antique.deposit(this.pichi.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.antique.deposit(this.dai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.antique.deposit(this.mic.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.antique.deposit(this.usdc.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.antique.deposit(this.weth.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.antique.deposit(this.strudel.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    // Approve Kusho to spend 'alice' AntiqueBox tokens
    await this.antique.setMasterContractApproval(this.alice.address, this.kushoMaster.address, true, "0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000")
    // **TO-DO - Initialize Kusho Pair**
    //const oracleData = await this.oracle.getDataParameter("1")
    //const initData = defaultAbiCoder.encode(["address", "address", "address", "bytes"], [this.pichi.address, this.dai.address, this.oracle.address, oracleData])
    //await this.antique.deploy(this.KushoMaster.address, initData, true)
  })

  describe("setBridge", function () {
    it("only allows the owner to set bridge", async function () {
      await expect(this.kushoMaker.connect(this.bob).setBridge(this.pichi.address, this.weth.address, { from: this.bob.address })).to.be.revertedWith("Ownable: caller is not the owner")
    })
    
    it("does not allow to set bridge for Pichi", async function () {
      await expect(this.kushoMaker.setBridge(this.pichi.address, this.weth.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.kushoMaker.setBridge(this.weth.address, this.pichi.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.kushoMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.kushoMaker.setBridge(this.dai.address, this.pichi.address))
        .to.emit(this.kushoMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.pichi.address)
    })
  })
  
  describe("convert", function () {
    it("reverts if caller is not EOA", async function () {
      await expect(this.exploiter.convert(this.pichi.address)).to.be.revertedWith("Maker: Must use EOA")
    })
  })
})
