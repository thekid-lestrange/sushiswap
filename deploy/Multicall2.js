module.exports = async function ({
  getNamedAccounts,
  deployments
}) {
  const {
    deploy
  } = deployments;

  const {
    deployer,
    dev
  } = await getNamedAccounts();

  await deploy("Multicall2", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });
  const callAddress = (await deployments.get("Multicall2")).address;
  if (callAddress) {
    console.log("Start verify Multicall2 Source code", callAddress)
    try {
      await run("verify:verify", {
        contract: "contracts/Multicall2.sol:Multicall2",
        address: callAddress,
        constructorArguments: [],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
};

module.exports.tags = ["Multicall2"];