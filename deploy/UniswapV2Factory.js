// Defining bytecode and abi from original contract on mainnet to ensure bytecode matches and it produces the same pair code hash
const {
  bytecode,
  abi,
} = require("../deployments/mainnet/UniswapV2Factory.json");

module.exports = async function ({
  getNamedAccounts,
  deployments,
}) {
  const {
    deploy
  } = deployments;
  const {
    deployer,
    dev
  } = await getNamedAccounts();
  await deploy("UniswapV2Factory", {
    contract: {
      abi,
      bytecode,
    },
    from: deployer,
    args: [dev],
    log: true,
    deterministicDeployment: false,
  });
  const factoryAddress = (await deployments.get("UniswapV2Factory")).address;
  if (factoryAddress) {
    console.log("Start verify Factory Source code", factoryAddress);
    try {
      await run("verify:verify", {
        contract: "contracts/uniswapv2/UniswapV2Factory.sol:UniswapV2Factory",
        address: factoryAddress,
        constructorArguments: [dev],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    }
  };
};
module.exports.tags = ["UniswapV2Factory", "AMM"];