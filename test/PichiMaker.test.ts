import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("PichiMaker", function () {
  before(async function () {
    await prepare(this, ["PichiMaker", "PolyCityHall", "PichiMakerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["pichi", this.ERC20Mock, ["PICHI", "PICHI", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.PolyCityHall, [this.pichi.address]]])
    await deploy(this, [["pichiMaker", this.PichiMaker, [this.factory.address, this.bar.address, this.pichi.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.PichiMakerExploitMock, [this.pichiMaker.address]]])
    await createSLP(this, "pichiEth", this.pichi, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "pichiUSDC", this.pichi, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Pichi", async function () {
      await expect(this.pichiMaker.setBridge(this.pichi.address, this.weth.address)).to.be.revertedWith("PichiMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.pichiMaker.setBridge(this.weth.address, this.pichi.address)).to.be.revertedWith("PichiMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.pichiMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("PichiMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.pichiMaker.setBridge(this.dai.address, this.pichi.address))
        .to.emit(this.pichiMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.pichi.address)
    })
  })
  describe("convert", function () {
    it("should convert PICHI - ETH", async function () {
      await this.pichiEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convert(this.pichi.address, this.weth.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichiEth.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - PICHI", async function () {
      await this.pichiUSDC.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convert(this.usdc.address, this.pichi.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichiUSDC.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convert(this.dai.address, this.weth.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.setBridge(this.usdc.address, this.pichi.address)
      await this.pichiMaker.setBridge(this.mic.address, this.usdc.address)
      await this.pichiMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.setBridge(this.usdc.address, this.pichi.address)
      await this.pichiMaker.setBridge(this.dai.address, this.usdc.address)
      await this.pichiMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.setBridge(this.dai.address, this.usdc.address)
      await this.pichiMaker.setBridge(this.mic.address, this.dai.address)
      await this.pichiMaker.convert(this.dai.address, this.mic.address)
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.setBridge(this.dai.address, this.mic.address)
      await this.pichiMaker.setBridge(this.mic.address, this.dai.address)
      await expect(this.pichiMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.pichiEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.pichi.address, this.weth.address)).to.be.revertedWith("PichiMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.pichiMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("PichiMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.pichiMaker.address, getBigNumber(1))
      await expect(this.pichiMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("PichiMaker: Cannot convert")
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.pichiMaker.address)).to.equal(getBigNumber(1))
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiEth.transfer(this.pichiMaker.address, getBigNumber(1))
      await this.pichiMaker.convertMultiple([this.dai.address, this.pichi.address], [this.weth.address, this.weth.address])
      expect(await this.pichi.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.pichiMaker.address)).to.equal(0)
      expect(await this.pichi.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
