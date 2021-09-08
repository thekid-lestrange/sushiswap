module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const pichi = await deployments.get("PolyCityDexToken")

  await deploy("PolyCityHall", {
    from: deployer,
    args: [pichi.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["PolyCityHall"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "PolyCityDexToken"]
