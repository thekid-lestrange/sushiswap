import { ethers } from "hardhat";
import { expect } from "chai";
import { encodeParameters, latest, duration, increase } from "./utilities"

describe("Timelock", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.dev = this.signers[3]
    this.minter = this.signers[4]

    this.PolyCityDexToken = await ethers.getContractFactory("PolyCityDexToken")
    this.Timelock = await ethers.getContractFactory("Timelock")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.minter)
    this.MasterChef = await ethers.getContractFactory("MasterChef")
  })

  beforeEach(async function () {
    this.pichi = await this.PolyCityDexToken.deploy()
    this.timelock = await this.Timelock.deploy(this.bob.address, "259200")
  })

  it("should not allow non-owner to do operation", async function () {
    await this.pichi.transferOwnership(this.timelock.address)
    // await expectRevert(this.pichi.transferOwnership(carol, { from: alice }), "Ownable: caller is not the owner")

    await expect(this.pichi.transferOwnership(this.carol.address)).to.be.revertedWith("Ownable: caller is not the owner")
    await expect(this.pichi.connect(this.bob).transferOwnership(this.carol.address)).to.be.revertedWith("Ownable: caller is not the owner")

    await expect(
      this.timelock.queueTransaction(
        this.pichi.address,
        "0",
        "transferOwnership(address)",
        encodeParameters(["address"], [this.carol.address]),
        (await latest()).add(duration.days(4))
      )
    ).to.be.revertedWith("Timelock::queueTransaction: Call must come from admin.")
  })

  it("should do the timelock thing", async function () {
    await this.pichi.transferOwnership(this.timelock.address)
    const eta = (await latest()).add(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .queueTransaction(this.pichi.address, "0", "transferOwnership(address)", encodeParameters(["address"], [this.carol.address]), eta)
    await increase(duration.days(1))
    await expect(
      this.timelock
        .connect(this.bob)
        .executeTransaction(this.pichi.address, "0", "transferOwnership(address)", encodeParameters(["address"], [this.carol.address]), eta)
    ).to.be.revertedWith("Timelock::executeTransaction: Transaction hasn't surpassed time lock.")
    await increase(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .executeTransaction(this.pichi.address, "0", "transferOwnership(address)", encodeParameters(["address"], [this.carol.address]), eta)
    expect(await this.pichi.owner()).to.equal(this.carol.address)
  })

  it("should also work with MasterChef", async function () {
    this.lp1 = await this.ERC20Mock.deploy("LPToken", "LP", "10000000000")
    this.lp2 = await this.ERC20Mock.deploy("LPToken", "LP", "10000000000")
    this.chef = await this.MasterChef.deploy(this.pichi.address, this.dev.address, "1000", "0", "1000")
    await this.pichi.transferOwnership(this.chef.address)
    await this.chef.add("100", this.lp1.address, true)
    await this.chef.transferOwnership(this.timelock.address)
    const eta = (await latest()).add(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .queueTransaction(
        this.chef.address,
        "0",
        "set(uint256,uint256,bool)",
        encodeParameters(["uint256", "uint256", "bool"], ["0", "200", false]),
        eta
      )
    await this.timelock
      .connect(this.bob)
      .queueTransaction(
        this.chef.address,
        "0",
        "add(uint256,address,bool)",
        encodeParameters(["uint256", "address", "bool"], ["100", this.lp2.address, false]),
        eta
      )
    await increase(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .executeTransaction(
        this.chef.address,
        "0",
        "set(uint256,uint256,bool)",
        encodeParameters(["uint256", "uint256", "bool"], ["0", "200", false]),
        eta
      )
    await this.timelock
      .connect(this.bob)
      .executeTransaction(
        this.chef.address,
        "0",
        "add(uint256,address,bool)",
        encodeParameters(["uint256", "address", "bool"], ["100", this.lp2.address, false]),
        eta
      )
    expect((await this.chef.poolInfo("0")).allocPoint).to.equal("200")
    expect(await this.chef.totalAllocPoint()).to.equal("300")
    expect(await this.chef.poolLength()).to.equal("2")
  })
})
