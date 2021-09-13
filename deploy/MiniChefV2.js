const {
  ChainId
} = require("@sushiswap/sdk")
const PICHI = {
  [ChainId.MATIC]: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a',
  [ChainId.MATIC_TESTNET]: '0xe23c7e19B29F6f206F2A0DdeE7324E1a467dd335'
}

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

  const chainId = await getChainId()

  let pichiAddress = (await deployments.get("PolyCityDexToken")).address;

  if (!pichiAddress) {
    throw Error("No PICHI!")
  }

  await deploy("MiniChefV2", {
    from: deployer,
    args: [pichiAddress],
    log: true,
    deterministicDeployment: false
  })

  const miniChefV2 = await ethers.getContract("MiniChefV2")
  if (await miniChefV2.owner() !== dev) {
    console.log("Transfer ownership of MiniChef to dev")
    await (await miniChefV2.transferOwnership(dev, true, false)).wait()
  }
  const miniAddress = (await deployments.get("MiniChefV2")).address;
  if (miniAddress) {
    console.log("Start verify MiniChefV2 Source code", miniAddress)
    try {
      await run("verify:verify", {
        contract: "contracts/MiniChefV2.sol:MiniChefV2",
        address: miniAddress,
        constructorArguments: [pichiAddress],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
};

module.exports.tags = ["MiniChefV2"]