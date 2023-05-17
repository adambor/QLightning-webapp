import ValidatedInput, {ValidatedInputRef} from "./ValidatedInput";
import * as React from "react";
import {useEffect, useRef, useState} from "react";
import BigNumber from "bignumber.js";
import {Button, Card, Modal} from "react-bootstrap";
import * as bolt11 from "bolt11";
import EVMtoBTCLNPanel from "./EVMtoBTCLNPanel";
import {ethers} from "ethers";
import set = Reflect.set;
import BTCLNtoEVMPanel from "./BTCLNtoEVMPanel";
import {EVMSwapper, SwapType} from "evmlightning-sdk";
import {FEConstants} from "../Constants";
import Icon from "react-icons-kit";
import {ic_qr_code_scanner} from 'react-icons-kit/md/ic_qr_code_scanner';
import {QrReader} from 'react-qr-reader';

function SwapTab(props: {
    signer: ethers.Signer,
    swapper: EVMSwapper
}) {

    const [amount, setAmount] = useState<string>(null);
    const amountRef = useRef<ValidatedInputRef>();

    const [kind, setKind] = useState<"BTCLNtoSol" | "SoltoBTCLN" | "SoltoBTC" | "BTCtoSol">("SoltoBTCLN");
    const kindRef = useRef<ValidatedInputRef>();

    const [token, setToken] = useState<string>(FEConstants.ethToken);
    const tokenRef = useRef<ValidatedInputRef>();

    const [address, setAddress] = useState<string>(null);
    const sendToRef = useRef<ValidatedInputRef>();
    const [scanning, setScanning] = useState<boolean>(false);

    const [step, setStep] = useState<number>(0);

    const [verifyAddress, setVerifyAddress] = useState<boolean>(false);

    useEffect(() => {

        const timeout = setTimeout(() => {
            const videoElement = document.getElementById("scanningQrVideo");
            if(videoElement!=null) videoElement.focus();
        }, 10);

        return () => {
            clearTimeout(timeout);
        }

    }, []);

    useEffect(() => {
        if(!verifyAddress) return;

        sendToRef.current.validate();

        setVerifyAddress(false);
    }, [verifyAddress]);

    return (
        <Card className="p-3">

            <Modal show={scanning} onHide={() => setScanning(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Scan the lightning invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <QrReader
                        onResult={(result, error) => {
                            if (!!error) {
                                //console.info(error);
                                return;
                            }
                            if(result) {
                                console.log(result);
                                let resultText = result.getText();
                                console.log(resultText);
                                let lightning: boolean = false;
                                if(resultText.startsWith("lightning:")) {
                                    resultText = resultText.substring(10);
                                }
                                let _amount: string = null;
                                if(resultText.startsWith("bitcoin:")) {
                                    resultText = resultText.substring(8);
                                    if(resultText.includes("?")) {
                                        const arr = resultText.split("?");
                                        resultText = arr[0];
                                        const params = arr[1].split("&");
                                        for(let param of params) {
                                            const arr2 = param.split("=");
                                            const key = arr2[0];
                                            const value = decodeURIComponent(arr2[1]);
                                            if(key==="amount") {
                                                _amount = value;
                                            }
                                        }
                                    }
                                }
                                if(_amount!=null) {
                                    setAmount(_amount);
                                }
                                setScanning(false);
                                setAddress(resultText);

                                if(props.swapper.isValidLightningInvoice(resultText)) {
                                    setKind("SoltoBTCLN");
                                    setStep(1);
                                } else if(props.swapper.isValidBitcoinAddress(resultText)) {
                                    setKind("SoltoBTC");
                                    if(_amount!=null) {
                                        setStep(1);
                                    }
                                } else {
                                    setVerifyAddress(true);
                                }
                            }
                        }}
                        constraints={{
                            facingMode: "environment"
                        }}
                        videoId={"scanningQrVideo"}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setScanning(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Card.Title>Swap now</Card.Title>
            <Card.Body>
                <ValidatedInput
                    disabled={step!==0}
                    inputRef={tokenRef}
                    className="mb-4"
                    type="select"
                    label={(
                        <span className="fw-semibold">Token</span>
                    )}
                    size={"lg"}
                    value={token}
                    onChange={(val) => {
                        console.log("Value selected: ", val);
                        setToken(val);
                    }}
                    placeholder="Enter amount you want to send"
                    onValidate={(val: any) => {
                        return null;
                    }}
                    options={
                        [
                            {
                                value: "Q",
                                key: FEConstants.ethToken
                            },
                            {
                                value: "WBTC",
                                key: FEConstants.wbtcToken
                            },
                            {
                                value: "USDC",
                                key: FEConstants.usdcToken
                            }
                        ]
                    }
                />

                <ValidatedInput
                    disabled={step!==0}
                    inputRef={kindRef}
                    className="mb-4"
                    type="select"
                    label={(
                        <span className="fw-semibold">Type</span>
                    )}
                    size={"lg"}
                    value={""+kind}
                    onChange={(val) => {
                        console.log("Value selected: ", val);
                        setKind(val);
                    }}
                    placeholder="Enter amount you want to send"
                    onValidate={(val: any) => {
                        return null;
                    }}
                    options={
                        [
                            {
                                value: "BTC-LN -> Q",
                                key: "BTCLNtoSol"
                            },
                            {
                                value: "BTC -> Q",
                                key: "BTCtoSol"
                            },
                            {
                                value: "Q -> BTC-LN",
                                key: "SoltoBTCLN"
                            },
                            {
                                value: "Q -> BTC",
                                key: "SoltoBTC"
                            }
                        ]
                    }
                />
                {kind==="BTCLNtoSol" || kind==="BTCtoSol" ? (
                    <ValidatedInput
                        disabled={step!==0}
                        inputRef={amountRef}
                        className="mt-1 strip-group-text form-align-end"
                        type="number"
                        value={amount}
                        size={"lg"}
                        label={(<span className="fw-semibold">Enter amount</span>)}
                        onChange={(val) => {
                            setAmount(val);
                        }}
                        min={
                            (kind==="BTCLNtoSol" ? new BigNumber(props.swapper.getMinimum(SwapType.FROM_BTCLN).toString(10)) : new BigNumber(props.swapper.getMinimum(SwapType.FROM_BTC).toString(10)))
                                .dividedBy(FEConstants.satsPerBitcoin)}
                        max={
                            (kind==="BTCLNtoSol" ? new BigNumber(props.swapper.getMaximum(SwapType.FROM_BTCLN).toString(10)) : new BigNumber(props.swapper.getMaximum(SwapType.FROM_BTC).toString(10)))
                                .dividedBy(FEConstants.satsPerBitcoin)}
                        step={new BigNumber("0.00000001")}
                        onValidate={(val: any) => {
                            return val==="" ? "Amount cannot be empty" : null;
                        }}
                    />
                ) : kind==="SoltoBTCLN" ? (
                    <ValidatedInput
                        inputRef={sendToRef}
                        className="mb-4"
                        type="text"
                        disabled={step!==0}
                        label={(
                            <span className="fw-semibold">Send to</span>
                        )}
                        textEnd={(
                            <a href="javascript:void(0);" onClick={() => setScanning(true)}>
                                <Icon icon={ic_qr_code_scanner} size={32}/>
                            </a>
                        )}
                        size={"lg"}
                        value={address}
                        onChange={setAddress}
                        placeholder="Enter destination address"
                        onValidate={(val: any) => {
                            if(val==="") return "Cannot be empty";
                            try {
                                const parsed = bolt11.decode(val);
                                console.log("parsed invoice: ", parsed);
                                if(parsed.satoshis==null) {
                                    return "Invoice needs to have an amount!";
                                }
                                if(parsed.timeExpireDate<(Date.now()/1000)) {
                                    return "Invoice already expired!";
                                }
                                // if(parsed.timeExpireDate-600<(Date.now()/1000)) {
                                //     return "Invoice will expire in less than 10 minutes!";
                                // }
                            } catch (e) {
                                console.error(e);
                                return "Invalid lightning invoice!";
                            }
                        }}
                    />
                ) : (
                    <>
                        <ValidatedInput
                            inputRef={sendToRef}
                            className="mb-4"
                            type="text"
                            disabled={step!==0}
                            label={(
                                <span className="fw-semibold">Send to</span>
                            )}
                            textEnd={(
                                <a href="javascript:void(0);" onClick={() => setScanning(true)}>
                                    <Icon icon={ic_qr_code_scanner} size={32}/>
                                </a>
                            )}
                            size={"lg"}
                            value={address}
                            onChange={setAddress}
                            placeholder="Enter destination address"
                            onValidate={(val: any) => {
                                if(val==="") return "Cannot be empty";
                                if(!props.swapper.isValidBitcoinAddress(val)) return "Invalid bitcoin address";
                            }}
                        />
                        <ValidatedInput
                            disabled={step!==0}
                            inputRef={amountRef}
                            className="mt-1 strip-group-text form-align-end"
                            type="number"
                            value={amount}
                            size={"lg"}
                            label={(<span className="fw-semibold">Enter amount</span>)}
                            onChange={(val) => {
                                setAmount(val);
                            }}
                            min={new BigNumber(props.swapper.getMinimum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin)}
                            max={new BigNumber(props.swapper.getMaximum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin)}
                            step={new BigNumber("0.00000001")}
                            onValidate={(val: any) => {
                                return val==="" ? "Amount cannot be empty" : null;
                            }}
                        />
                    </>
                )}
                {step===1 ? (
                    <>
                        {kind==="SoltoBTCLN" ? (
                            <EVMtoBTCLNPanel token={token} bolt11PayReq={address} signer={props.signer} swapType={SwapType.TO_BTCLN} swapper={props.swapper}/>
                        ) : kind==="BTCLNtoSol" ? (
                            <BTCLNtoEVMPanel token={token} amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.FROM_BTCLN} swapper={props.swapper}/>
                        ) : kind==="BTCtoSol" ? (
                            <BTCLNtoEVMPanel token={token} amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.FROM_BTC} swapper={props.swapper}/>
                        ) : (
                            <EVMtoBTCLNPanel token={token} bolt11PayReq={address} amount={new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin)} signer={props.signer} swapType={SwapType.TO_BTC} swapper={props.swapper}/>
                        )}
                        <Button className="mt-3" variant="secondary" size={"lg"} onClick={() => {
                            setStep(0);
                        }}>
                            Back
                        </Button>
                    </>
                ) : (
                    <Button className="mt-3" size={"lg"} onClick={() => {
                        if(!tokenRef.current.validate()) {
                            return;
                        }

                        if(kind==="BTCLNtoSol" || kind==="BTCtoSol") {
                            if(!amountRef.current.validate()) {
                                return;
                            }
                        } else if(kind==="SoltoBTCLN") {
                            if(!sendToRef.current.validate()) {
                                return;
                            }
                        } else {
                            if(!amountRef.current.validate()) {
                                return;
                            }
                            if(!sendToRef.current.validate()) {
                                return;
                            }
                        }
                        setStep(1)
                    }}>
                        Continue
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
}

export default SwapTab;