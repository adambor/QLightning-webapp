const btclntoevmContract = {
    address: "0xb8857741181E87A0E5553A2F11c4A5962FBc1557".toLowerCase(),
    abi: [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "claimer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "paymentHash",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "internalType": "bytes32",
                    "name": "secret",
                    "type": "bytes32"
                }
            ],
            "name": "Claimed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "claimer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "paymentHash",
                    "type": "bytes32"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "indexed": false,
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "data",
                    "type": "tuple"
                }
            ],
            "name": "PaymentRequest",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "claimer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "paymentHash",
                    "type": "bytes32"
                }
            ],
            "name": "Refunded",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "bytes32",
                    "name": "secret",
                    "type": "bytes32"
                },
                {
                    "internalType": "bool",
                    "name": "payOut",
                    "type": "bool"
                }
            ],
            "name": "claimer_claim",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "bytes32",
                    "name": "secret",
                    "type": "bytes32"
                }
            ],
            "name": "claimer_claim",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "uint64",
                    "name": "timeout",
                    "type": "uint64"
                },
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "r",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "s",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint8",
                            "name": "v",
                            "type": "uint8"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.Signature",
                    "name": "signature",
                    "type": "tuple"
                },
                {
                    "internalType": "bool",
                    "name": "payOut",
                    "type": "bool"
                }
            ],
            "name": "claimer_refundPayer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "uint64",
                    "name": "timeout",
                    "type": "uint64"
                },
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "r",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "s",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint8",
                            "name": "v",
                            "type": "uint8"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.Signature",
                    "name": "signature",
                    "type": "tuple"
                }
            ],
            "name": "claimer_refundPayer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                }
            ],
            "name": "claimer_refundPayer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "deposit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                }
            ],
            "name": "offerer_payInvoice",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "offerer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "uint64",
                    "name": "timeout",
                    "type": "uint64"
                },
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "r",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "s",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint8",
                            "name": "v",
                            "type": "uint8"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.Signature",
                    "name": "signature",
                    "type": "tuple"
                }
            ],
            "name": "offerer_payInvoice",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "bool",
                    "name": "payIn",
                    "type": "bool"
                }
            ],
            "name": "offerer_payInvoice",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct[]",
                    "name": "payReqs",
                    "type": "tuple[]"
                },
                {
                    "internalType": "bool",
                    "name": "payOut",
                    "type": "bool"
                }
            ],
            "name": "offerer_refund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                }
            ],
            "name": "offerer_refund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "payReq",
                    "type": "tuple"
                },
                {
                    "internalType": "bool",
                    "name": "payOut",
                    "type": "bool"
                }
            ],
            "name": "offerer_refund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct[]",
                    "name": "payReqs",
                    "type": "tuple[]"
                }
            ],
            "name": "offerer_refund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct[]",
                    "name": "payReqs",
                    "type": "tuple[]"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "newPayReq",
                    "type": "tuple"
                }
            ],
            "name": "offerer_refund_payInvoice",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "who",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "paymentHash",
                    "type": "bytes32"
                }
            ],
            "name": "getCommitment",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "intermediary",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "paymentHash",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expiry",
                            "type": "uint64"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.AtomicSwapStruct",
                    "name": "data",
                    "type": "tuple"
                },
                {
                    "internalType": "uint64",
                    "name": "timeout",
                    "type": "uint64"
                },
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "r",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "s",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint8",
                            "name": "v",
                            "type": "uint8"
                        }
                    ],
                    "internalType": "struct BTCLNtoEVM.Signature",
                    "name": "sig",
                    "type": "tuple"
                },
                {
                    "internalType": "bytes",
                    "name": "kind",
                    "type": "bytes"
                }
            ],
            "name": "getHash",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                }
            ],
            "name": "myBalance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
};

export default btclntoevmContract;