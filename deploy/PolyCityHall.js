module.exports = async function ({
  getNamedAccounts,
  deployments
}) {
  const {
    deploy
  } = deployments

  const {
    deployer
  } = await getNamedAccounts()

  const pichi = await deployments.get("PolyCityDexToken")

  await deploy("PolyCityHall", {
    from: deployer,
    args: [pichi.address],
    log: true,
    deterministicDeployment: false
  })
  const hallAddress = (await deployments.get("PolyCityHall")).address;
  if (hallAddress) {
    console.log("Start verify PolyCityHall Source code", hallAddress)
    try {
      await run("verify:verify", {
        contract: "contracts/PolyCityHall.sol:PolyCityHall",
        address: hallAddress,
        constructorArguments: [pichi.address],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
}

module.exports.tags = ["PolyCityHall"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "PolyCityDexToken"]