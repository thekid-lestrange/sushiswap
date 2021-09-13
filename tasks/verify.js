const {
    WETH
} = require("@sushiswap/sdk")
module.exports = async function ({
    ethers,
    deployments,
    getNamedAccounts
}) {
    const {
        deployer,
        dev
    } = await getNamedAccounts()
    const chainId = await getChainId()
    let wethAddress;

    if (chainId === '31337') {
        wethAddress = (await deployments.get("WETH9Mock")).address
    } else if (chainId in WETH) {
        wethAddress = WETH[chainId].address
    } else {
        throw Error("No WETH!")
    }
    const masterChef = await ethers.getContract("MasterChef").address
    const miniChef = await ethers.getContract("MiniChefV2").address
    const multicall2 = await ethers.getContract("Multicall2").address
    const pichiMaker = await ethers.getContract("PichiMaker").address
    const pichiRoll = await ethers.getContract("PichiRoll").address
    const polyCityToken = await ethers.getContract("PolyCityDexToken").address
    const polyCityHall = await ethers.getContract("PolyCityHall").address
    const uniswapV2Factory = await ethers.getContract("UniswapV2Factory").address
    const uniswapV2Router = await ethers.getContract("UniswapV2Router02").address
    const timeLock = await ethers.getContract("Timelock").address
    await hre.run("verify:verify", {
        address: masterChef,
        constructorArguments: [polyCityToken, dev, "1000000000000000", "0", "1000000000000000000000"],
    });
    await hre.run("verify:verify", {
        address: miniChef,
        constructorArguments: [polyCityToken],
    });
    await hre.run("verify:verify", {
        address: multicall2,
    });
    await hre.run("verify:verify", {
        address: pichiMaker,
        constructorArguments: [uniswapV2Factory, polyCityHall, polyCityToken, wethAddress],
    });
    await hre.run("verify:verify", {
        address: pichiRoll,
        constructorArguments: [uniswapV2Factory, uniswapV2Factory],
    });
    await hre.run("verify:verify", {
        address: polyCityHall,
        constructorArguments: [polyCityToken],
    });
    await hre.run("verify:verify", {
        address: polyCityToken,
    });
    await hre.run("verify:verify", {
        address: uniswapV2Factory,
        constructorArguments: [dev],
    });
    await hre.run("verify:verify", {
        address: uniswapV2Router,
        constructorArguments: [uniswapV2Factory, wethAddress],
    });
    await hre.run("verify:verify", {
        address: timeLock,
        constructorArguments: [deployer, "84000"],
    });
}