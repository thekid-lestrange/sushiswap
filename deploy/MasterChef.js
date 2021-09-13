module.exports = async function ({
  ethers,
  deployments,
  getNamedAccounts
}) {
  const {
    deploy
  } = deployments

  const {
    deployer,
    dev
  } = await getNamedAccounts()

  const pichi = await ethers.getContract("PolyCityDexToken")

  const {
    address
  } = await deploy("MasterChef", {
    from: deployer,
    args: [pichi.address, dev, "1000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  // Mint some Pichi for testing purpose
  if (await pichi.balanceOf(dev) == 0) {
    console.log("Mint some of Pichi for testing purpose")
    await (await pichi.mint(dev, "1000000000000000000000")).wait()
  }

  if (await pichi.owner() !== address) {
    // Transfer Pichi Ownership to Chef
    console.log("Transfer Pichi Ownership to Chef")
    await (await pichi.transferOwnership(address)).wait()
  }

  const masterChef = await ethers.getContract("MasterChef")
  if (await masterChef.owner() !== dev) {
    // Transfer ownership of MasterChef to dev
    console.log("Transfer ownership of MasterChef to dev")
    await (await masterChef.transferOwnership(dev)).wait()
  }
  const masterAddress = (await deployments.get("MasterChef")).address;
  if (masterAddress) {
    console.log("Start verify MasterChef Source code", masterAddress)
    try {
      await run("verify:verify", {
        contract: "contracts/MasterChef.sol:MasterChef",
        address: masterAddress,
        constructorArguments: [pichi.address, dev, "1000000000000000", "0", "1000000000000000000000"],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
};

module.exports.tags = ["MasterChef"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "PolyCityDexToken"]