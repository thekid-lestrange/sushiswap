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
   await deploy("PolyCityDexToken", {
     from: deployer,
     log: true,
     deterministicDeployment: false
   });
   const pichiAddress = (await deployments.get("PolyCityDexToken")).address;
   if (pichiAddress) {
     console.log("Start verify PolyCityDexToken Source code", pichiAddress)
     try {
       await run("verify:verify", {
         contract: "contracts/PolyCityDexToken.sol:PolyCityDexToken",
         address: pichiAddress,
         constructorArguments: [],
       });
     } catch (e) {
       console.log(`Failed to verify contract: ${e}`);
     }
   };
 }

 module.exports.tags = ["PolyCityDexToken"]
 module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]