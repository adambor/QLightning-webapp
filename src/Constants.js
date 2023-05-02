import BigNumber from "bignumber.js";
export const FEConstants = {
    // expirySecondsBTCLNtoSol: 1*86400, //1 days
    // expirySecondsSoltoBTCLN: 3*86400, //3 days
    // confirmationsSoltoBTC: 3,
    // confirmationTargetSoltoBTC: 3,
    // url: "https://node3.gethopa.com",
    // customPorts: {
    //     [SwapType.BTCLN_TO_SOL]: 34000,
    //     [SwapType.SOL_TO_BTCLN]: 34001,
    //     [SwapType.BTC_TO_SOL]: 34002,
    //     [SwapType.SOL_TO_BTC]: 34003,
    // },
    // url: "http://localhost:4000",
    // customPorts: null,
    // ethereum: {
    //     chainId: 80001,
    //     chainName: "Polygon testnet",
    //     nativeCurrency: {
    //         name: "Polygon",
    //         symbol: "MATIC",
    //         decimals: 18
    //     },
    //     blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
    //     rpcUrls: ["https://matic-mumbai.chainstacklabs.com"]
    // },
    // wbtcToken: "0xf48A276452B4C630dAED3f4626B01Cb1c352FaBC",
    // usdcToken: "0x492A9f5b8Fd9B67e95a4F0Cb15Cf1EC345aD35C3",
    // usdtToken: "0x9Fe211772141F5dea4B97095c7e6302a878B4eCf",
    // ethToken: "0x0000000000000000000000000000000000000000",
    // tokenData: {
    //     "0xf48A276452B4C630dAED3f4626B01Cb1c352FaBC": {
    //         decimals: 8,
    //         symbol: "WBTC",
    //         coinId: "wrapped-bitcoin",
    //         displayDecimals: 8
    //     },
    //     "0x492A9f5b8Fd9B67e95a4F0Cb15Cf1EC345aD35C3": {
    //         decimals: 6,
    //         symbol: "USDC",
    //         coinId: "usd-coin",
    //         displayDecimals: 6
    //     },
    //     "0x9Fe211772141F5dea4B97095c7e6302a878B4eCf": {
    //         decimals: 6,
    //         symbol: "USDT",
    //         coinId: "tether",
    //         displayDecimals: 6
    //     },
    //     "0x0000000000000000000000000000000000000000": {
    //         decimals: 18,
    //         symbol: "MATIC",
    //         coinId: "matic-network",
    //         displayDecimals: 6
    //     }
    // },
    ethereum: {
        chainId: 137,
        chainName: "Polygon",
        nativeCurrency: {
            name: "Polygon",
            symbol: "MATIC",
            decimals: 18
        },
        blockExplorerUrls: ["https://polygonscan.com/"],
        rpcUrls: ["https://polygon-rpc.com"]
    },
    wbtcToken: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    usdcToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    usdtToken: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    ethToken: "0x0000000000000000000000000000000000000000",
    tokenData: {
        "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6": {
            decimals: 8,
            symbol: "WBTC",
            coinId: "wrapped-bitcoin",
            displayDecimals: 8
        },
        "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": {
            decimals: 6,
            symbol: "USDC",
            coinId: "usd-coin",
            displayDecimals: 6
        },
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
            decimals: 6,
            symbol: "USDT",
            coinId: "tether",
            displayDecimals: 6
        },
        "0x0000000000000000000000000000000000000000": {
            decimals: 18,
            symbol: "MATIC",
            coinId: "matic-network",
            displayDecimals: 6
        }
    },
    url: null,
    satsPerBitcoin: new BigNumber(100000000)
};
