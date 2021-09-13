const {
  WETH
} = require("@sushiswap/sdk")

module.exports = async function ({
  ethers: {
    getNamedSigner
  },
  getNamedAccounts,
  deployments
}) {
  const {
    deploy
  } = deployments

  const {
    deployer,
    dev
  } = await getNamedAccounts()

  const chainId = await getChainId()

  const factoryAddress = (await ethers.getContract("UniswapV2Factory")).address
  const barAddress = (await ethers.getContract("PolyCityHall")).address
  const pichiAddress = (await ethers.getContract("PolyCityDexToken")).address

  let wethAddress;

  if (chainId === '31337') {
    wethAddress = (await deployments.get("WETH9Mock")).address
  } else if (chainId in WETH) {
    wethAddress = WETH[chainId].address
  } else {
    throw Error("No WETH!")
  }

  await deploy("PichiMaker", {
    from: deployer,
    args: [factoryAddress, barAddress, pichiAddress, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("PichiMaker")
  if (await maker.owner() !== dev) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(dev, true, false)).wait()
  }
  if (maker.address) {
    console.log("Start verify PichiMaker Source code", maker.address)
    try {
      await run("verify:verify", {
        contract: "contracts/PichiMaker.sol:PichiMaker",
        address: maker.address,
        constructorArguments: [factoryAddress, barAddress, pichiAddress, wethAddress],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
}
module.exports.tags = ["PichiMaker"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "PolyCityHall", "PolyCityDexToken"]