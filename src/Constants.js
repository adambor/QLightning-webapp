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
        chainId: 35441,
        chainName: "Q Protocol",
        nativeCurrency: {
            name: "Q Token",
            symbol: "QT",
            decimals: 18
        },
        blockExplorerUrls: ["https://explorer.q.org/"],
        rpcUrls: ["https://rpc.q.org"]
    },
    wbtcToken: "0x864779670a7b3205580d0a3Be85744954ab075e7",
    usdcToken: "0xC382cA00c56023C4A870473f14890A023Ca4706f",
    usdtToken: "0x1234912185912561275418727185781012124012",
    ethToken: "0x0000000000000000000000000000000000000000",
    tokenData: {
        "0x864779670a7b3205580d0a3Be85744954ab075e7": {
            decimals: 8,
            symbol: "WBTC",
            coinId: "wrapped-bitcoin",
            displayDecimals: 8
        },
        "0xC382cA00c56023C4A870473f14890A023Ca4706f": {
            decimals: 6,
            symbol: "USDC",
            coinId: "usd-coin",
            displayDecimals: 6
        },
        "0x1234912185912561275418727185781012124012": {
            decimals: 6,
            symbol: "USDT",
            coinId: "tether",
            displayDecimals: 6
        },
        "0x0000000000000000000000000000000000000000": {
            decimals: 18,
            symbol: "Q",
            coinId: "$fixed-1218",
            displayDecimals: 6
        }
    },
    url: null,
    satsPerBitcoin: new BigNumber(100000000)
};
