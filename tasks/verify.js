module.exports = async function ({
    ethers,
    deployments,
    getNamedAccounts
}) {


    const factory = await ethers.getContract("UniswapV2Factory")
    const pichi = (await deployments.get("PolyCityDexToken")).address
    console.log("Print Factory Contract", pichi)
    //console.log("Print Factory Address", factory.address)
    await run("verify:verify", {
        contract: "contracts/uniswapv2/UniswapV2Router02.sol:UniswapV2Router02",
        address: "0x007Fe3167E794f255651e2d6723351DB6101c1b5",
        constructorArguments: ["0x7Af7A3fBFE2912C600539d1B10A936091B19b3FF", "0x5B67676a984807a212b1c59eBFc9B3568a474F0a"],
    });
};

module.exports.tags = ["UniswapV2Factory", "AMM"];