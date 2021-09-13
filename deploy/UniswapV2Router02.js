const {
  WETH
} = require("@sushiswap/sdk");

module.exports = async function ({
  getNamedAccounts,
  deployments
}) {
  const {
    deploy
  } = deployments;
  const {
    deployer
  } = await getNamedAccounts();
  const chainId = await getChainId();
  let wethAddress;
  if (chainId === "31337") {
    wethAddress = (await deployments.get("WETH9Mock")).address;
  } else if (chainId in WETH) {
    wethAddress = WETH[chainId].address;
  } else {
    throw Error("No WNATIVE!");
  }
  const factoryAddress = (await deployments.get("UniswapV2Factory")).address;
  await deploy("UniswapV2Router02", {
    from: deployer,
    args: [factoryAddress, wethAddress],
    log: true,
    deterministicDeployment: false,
  });
  const routerAddress = (await deployments.get("UniswapV2Router02")).address;
  if (routerAddress) {
    console.log("Start verify Router Source code", routerAddress);
    try {
      await run("verify:verify", {
        contract: "contracts/uniswapv2/UniswapV2Router02.sol:UniswapV2Router02",
        address: routerAddress,
        constructorArguments: [factoryAddress, wethAddress],
      });
    } catch (e) {
      console.log(`Failed to verify contract: ${e}`);
    };
  };
};

module.exports.tags = ["UniswapV2Router02", "AMM"];
module.exports.dependencies = ["UniswapV2Factory", "Mocks"];