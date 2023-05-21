import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import ValidatedInput from "./ValidatedInput";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { Button, Card, Modal } from "react-bootstrap";
import * as bolt11 from "bolt11";
import EVMtoBTCLNPanel from "./EVMtoBTCLNPanel";
import BTCLNtoEVMPanel from "./BTCLNtoEVMPanel";
import { SwapType } from "evmlightning-sdk";
import { FEConstants } from "../Constants";
import Icon from "react-icons-kit";
import { ic_qr_code_scanner } from 'react-icons-kit/md/ic_qr_code_scanner';
import { QrReader } from 'react-qr-reader';
function SwapTab(props) {
    const [amount, setAmount] = useState(null);
    const amountRef = useRef();
    const [kind, setKind] = useState("SoltoBTCLN");
    const kindRef = useRef();
    const [token, setToken] = useState(FEConstants.ethToken);
    const tokenRef = useRef();
    const [address, setAddress] = useState(null);
    const sendToRef = useRef();
    const [scanning, setScanning] = useState(false);
    const [step, setStep] = useState(0);
    const [verifyAddress, setVerifyAddress] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            const videoElement = document.getElementById("scanningQrVideo");
            if (videoElement != null)
                videoElement.focus();
        }, 10);
        return () => {
            clearTimeout(timeout);
        };
    }, []);
    useEffect(() => {
        if (!verifyAddress)
            return;
        sendToRef.current.validate();
        setVerifyAddress(false);
    }, [verifyAddress]);
    return (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Modal, Object.assign({ show: scanning, onHide: () => setScanning(false) }, { children: [_jsx(Modal.Header, Object.assign({ closeButton: true }, { children: _jsx(Modal.Title, { children: "Scan the lightning invoice" }) })), _jsx(Modal.Body, { children: _jsx(QrReader, { onResult: (result, error) => {
                                if (!!error) {
                                    //console.info(error);
                                    return;
                                }
                                if (result) {
                                    console.log(result);
                                    let resultText = result.getText();
                                    console.log(resultText);
                                    let lightning = false;
                                    if (resultText.startsWith("lightning:")) {
                                        resultText = resultText.substring(10);
                                    }
                                    let _amount = null;
                                    if (resultText.startsWith("bitcoin:")) {
                                        resultText = resultText.substring(8);
                                        if (resultText.includes("?")) {
                                            const arr = resultText.split("?");
                                            resultText = arr[0];
                                            const params = arr[1].split("&");
                                            for (let param of params) {
                                                const arr2 = param.split("=");
                                                const key = arr2[0];
                                                const value = decodeURIComponent(arr2[1]);
                                                if (key === "amount") {
                                                    _amount = value;
                                                }
                                            }
                                        }
                                    }
                                    if (_amount != null) {
                                        setAmount(_amount);
                                    }
                                    setScanning(false);
                                    setAddress(resultText);
                                    if (props.swapper.isValidLightningInvoice(resultText)) {
                                        setKind("SoltoBTCLN");
                                        setStep(1);
                                    }
                                    else if (props.swapper.isValidBitcoinAddress(resultText)) {
                                        setKind("SoltoBTC");
                                        if (_amount != null) {
                                            setStep(1);
                                        }
                                    }
                                    else {
                                        setVerifyAddress(true);
                                    }
                                }
                            }, constraints: {
                                facingMode: "environment"
                            }, videoId: "scanningQrVideo" }) }), _jsx(Modal.Footer, { children: _jsx(Button, Object.assign({ variant: "secondary", onClick: () => setScanning(false) }, { children: "Close" })) })] })), _jsx(Card.Title, { children: "Swap now" }), _jsxs(Card.Body, { children: [_jsx(ValidatedInput, { disabled: step !== 0, inputRef: tokenRef, className: "mb-4", type: "select", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Token" }))), size: "lg", value: token, onChange: (val) => {
                            console.log("Value selected: ", val);
                            setToken(val);
                        }, placeholder: "Enter amount you want to send", onValidate: (val) => {
                            return null;
                        }, options: [
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
                        ] }), _jsx(ValidatedInput, { disabled: step !== 0, inputRef: kindRef, className: "mb-4", type: "select", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Type" }))), size: "lg", value: "" + kind, onChange: (val) => {
                            console.log("Value selected: ", val);
                            setKind(val);
                        }, placeholder: "Enter amount you want to send", onValidate: (val) => {
                            return null;
                        }, options: [
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
                        ] }), kind === "BTCLNtoSol" || kind === "BTCtoSol" ? (_jsx(ValidatedInput, { disabled: step !== 0, inputRef: amountRef, className: "mt-1 strip-group-text form-align-end", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                            setAmount(val);
                        }, min: (kind === "BTCLNtoSol" ? new BigNumber(props.swapper.getMinimum(SwapType.FROM_BTCLN).toString(10)) : new BigNumber(props.swapper.getMinimum(SwapType.FROM_BTC).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin), max: (kind === "BTCLNtoSol" ? new BigNumber(props.swapper.getMaximum(SwapType.FROM_BTCLN).toString(10)) : new BigNumber(props.swapper.getMaximum(SwapType.FROM_BTC).toString(10)))
                            .dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                            return val === "" ? "Amount cannot be empty" : null;
                        } })) : kind === "SoltoBTCLN" ? (_jsx(ValidatedInput, { inputRef: sendToRef, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => setScanning(true) }, { children: _jsx(Icon, { icon: ic_qr_code_scanner, size: 32 }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                            if (val === "")
                                return "Cannot be empty";
                            try {
                                const parsed = bolt11.decode(val);
                                console.log("parsed invoice: ", parsed);
                                if (parsed.satoshis == null) {
                                    return "Invoice needs to have an amount!";
                                }
                                if (parsed.timeExpireDate < (Date.now() / 1000)) {
                                    return "Invoice already expired!";
                                }
                                // if(parsed.timeExpireDate-600<(Date.now()/1000)) {
                                //     return "Invoice will expire in less than 10 minutes!";
                                // }
                            }
                            catch (e) {
                                console.error(e);
                                return "Invalid lightning invoice!";
                            }
                        } })) : (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { inputRef: sendToRef, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => setScanning(true) }, { children: _jsx(Icon, { icon: ic_qr_code_scanner, size: 32 }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                                    if (val === "")
                                        return "Cannot be empty";
                                    if (!props.swapper.isValidBitcoinAddress(val))
                                        return "Invalid bitcoin address";
                                } }), _jsx(ValidatedInput, { disabled: step !== 0, inputRef: amountRef, className: "mt-1 strip-group-text form-align-end", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                                    setAmount(val);
                                }, min: new BigNumber(props.swapper.getMinimum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), max: new BigNumber(props.swapper.getMaximum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                                    return val === "" ? "Amount cannot be empty" : null;
                                } })] })), step === 1 ? (_jsxs(_Fragment, { children: [kind === "SoltoBTCLN" ? (_jsx(EVMtoBTCLNPanel, { token: token, bolt11PayReq: address, signer: props.signer, swapType: SwapType.TO_BTCLN, swapper: props.swapper })) : kind === "BTCLNtoSol" ? (_jsx(BTCLNtoEVMPanel, { token: token, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.FROM_BTCLN, swapper: props.swapper })) : kind === "BTCtoSol" ? (_jsx(BTCLNtoEVMPanel, { token: token, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.FROM_BTC, swapper: props.swapper })) : (_jsx(EVMtoBTCLNPanel, { token: token, bolt11PayReq: address, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.TO_BTC, swapper: props.swapper })), _jsx(Button, Object.assign({ className: "mt-3", variant: "secondary", size: "lg", onClick: () => {
                                    setStep(0);
                                } }, { children: "Back" }))] })) : (_jsx(Button, Object.assign({ className: "mt-3", size: "lg", onClick: () => {
                            if (!tokenRef.current.validate()) {
                                return;
                            }
                            if (kind === "BTCLNtoSol" || kind === "BTCtoSol") {
                                if (!amountRef.current.validate()) {
                                    return;
                                }
                            }
                            else if (kind === "SoltoBTCLN") {
                                if (!sendToRef.current.validate()) {
                                    return;
                                }
                            }
                            else {
                                if (!amountRef.current.validate()) {
                                    return;
                                }
                                if (!sendToRef.current.validate()) {
                                    return;
                                }
                            }
                            setStep(1);
                        } }, { children: "Continue" })))] })] })));
}
export default SwapTab;
