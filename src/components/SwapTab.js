import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import ValidatedInput from "./ValidatedInput";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { Alert, Button, Card, Modal } from "react-bootstrap";
import * as bolt11 from "bolt11";
import EVMtoBTCLNPanel from "./EVMtoBTCLNPanel";
import BTCLNtoEVMPanel from "./BTCLNtoEVMPanel";
import { SwapType } from "evmlightning-sdk";
import { FEConstants } from "../Constants";
import Icon from "react-icons-kit";
import { ic_qr_code_scanner } from 'react-icons-kit/md/ic_qr_code_scanner';
import * as BN from "bn.js";
import { QRScanner } from "./qr/QRScanner";
function SwapTab(props) {
    const [comment, setComment] = useState(null);
    const commentRef = useRef();
    const [amount, setAmount] = useState(null);
    const amountRef = useRef();
    const [kind, setKind] = useState("SoltoBTCLN");
    const kindRef = useRef();
    const [token, setToken] = useState(FEConstants.ethToken);
    const tokenRef = useRef();
    const [address, setAddress] = useState(null);
    const [addressError, setAddressError] = useState(null);
    const sendToRef = useRef();
    const [scanning, setScanning] = useState(false);
    const scanningRef = useRef(false);
    const [step, setStep] = useState(0);
    const addressValidateCount = useRef(0);
    const [verifyAddress, setVerifyAddress] = useState(false);
    const [verifyAmount, setVerifyAmount] = useState(false);
    const [lnurlLoading, setLnurlLoading] = useState(false);
    const [lnurlState, setLnurlState] = useState(null);
    useEffect(() => {
        if (!verifyAddress)
            return;
        sendToRef.current.validate();
        setVerifyAddress(false);
    }, [verifyAddress]);
    useEffect(() => {
        if (!verifyAmount)
            return;
        amountRef.current.validate();
        setVerifyAmount(false);
    }, [verifyAmount]);
    return (_jsxs(Card, Object.assign({ className: "p-3" }, { children: [_jsxs(Modal, Object.assign({ show: scanning, onHide: () => setScanning(false) }, { children: [_jsx(Modal.Header, Object.assign({ closeButton: true }, { children: _jsx(Modal.Title, { children: "Scan the lightning invoice" }) })), _jsx(Modal.Body, { children: _jsx(QRScanner, { onResult: (result, error) => {
                                if (!scanningRef.current)
                                    return;
                                if (!!error) {
                                    //console.info(error);
                                    return;
                                }
                                if (result) {
                                    console.log(result);
                                    let resultText = result.data;
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
                                    scanningRef.current = false;
                                    setAddress(resultText);
                                    if (props.swapper.isValidLightningInvoice(resultText)) {
                                        setKind("SoltoBTCLN");
                                        setVerifyAddress(true);
                                        setStep(1);
                                    }
                                    else if (props.swapper.isValidLNURL(resultText)) {
                                        if (kind !== "SoltoBTCLN" && kind !== "BTCLNtoSol") {
                                            setKind("SoltoBTCLN");
                                        }
                                        setVerifyAddress(true);
                                    }
                                    else if (props.swapper.isValidBitcoinAddress(resultText)) {
                                        setKind("SoltoBTC");
                                        setVerifyAddress(true);
                                        if (_amount != null) {
                                            setStep(1);
                                        }
                                    }
                                    else {
                                        setVerifyAddress(true);
                                    }
                                }
                            }, camera: "environment" }) }), _jsx(Modal.Footer, { children: _jsx(Button, Object.assign({ variant: "secondary", onClick: () => {
                                setScanning(false);
                                scanningRef.current = false;
                            } }, { children: "Close" })) })] })), _jsx(Card.Title, { children: "Swap now" }), _jsxs(Card.Body, { children: [_jsx(ValidatedInput, { disabled: step !== 0, inputRef: tokenRef, className: "mb-4", type: "select", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Token" }))), size: "lg", value: token, onChange: (val) => {
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
                            setLnurlState(null);
                            setLnurlLoading(false);
                            setAddress("");
                            setAddressError(null);
                            addressValidateCount.current++;
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
                        ] }), kind === "BTCLNtoSol" || kind === "BTCtoSol" ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { disabled: step !== 0 || (kind === "BTCLNtoSol" && lnurlState != null && lnurlState.max.eq(lnurlState.min)), inputRef: amountRef, className: "mb-4 strip-group-text", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                                    setAmount(val);
                                }, textEnd: (kind === "BTCLNtoSol" && lnurlState != null && !lnurlState.max.eq(lnurlState.min)) ? (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => {
                                        setAmount(new BigNumber(BN.min(props.swapper.getMaximum(SwapType.FROM_BTCLN), lnurlState.max).toString(10)).dividedBy(new BigNumber(100000000)).toFixed(8));
                                        setVerifyAmount(true);
                                    } }, { children: "Max." }))) : null, min: (kind === "BTCLNtoSol" ? new BigNumber(BN.max(props.swapper.getMinimum(SwapType.FROM_BTCLN), (lnurlState === null || lnurlState === void 0 ? void 0 : lnurlState.min) == null ? new BN(0) : lnurlState.min).toString(10)) : new BigNumber(props.swapper.getMinimum(SwapType.FROM_BTC).toString(10)))
                                    .dividedBy(FEConstants.satsPerBitcoin), max: (kind === "BTCLNtoSol" ? new BigNumber(BN.min(props.swapper.getMaximum(SwapType.FROM_BTCLN), (lnurlState === null || lnurlState === void 0 ? void 0 : lnurlState.max) == null ? new BN("2100000000000000") : lnurlState === null || lnurlState === void 0 ? void 0 : lnurlState.max).toString(10)) : new BigNumber(props.swapper.getMaximum(SwapType.FROM_BTC).toString(10)))
                                    .dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                                    return val === "" ? "Amount cannot be empty" : null;
                                } }), kind === "BTCLNtoSol" ? (_jsx(ValidatedInput, { inputRef: sendToRef, validated: addressError, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Withdraw from (optional)" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => {
                                        setScanning(true);
                                        scanningRef.current = true;
                                    } }, { children: _jsx(Icon, { icon: ic_qr_code_scanner, size: 32 }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter LNURL withdraw link", onValidate: (val) => {
                                    setAddressError(null);
                                    if (val === "") {
                                        setLnurlLoading(false);
                                        setLnurlState(null);
                                        addressValidateCount.current++;
                                        return null;
                                    }
                                    addressValidateCount.current++;
                                    const current = addressValidateCount.current;
                                    if (props.swapper.isValidLNURL(val)) {
                                        if (lnurlState != null && lnurlState.value === val) {
                                            if (lnurlState.type === "pay") {
                                                setKind("SoltoBTCLN");
                                            }
                                            if (lnurlState.type === "withdraw") {
                                                setKind("BTCLNtoSol");
                                            }
                                            return null;
                                        }
                                        setLnurlLoading(true);
                                        setLnurlState(null);
                                        props.swapper.getLNURLTypeAndData(val).then(result => {
                                            if (addressValidateCount.current != current)
                                                return;
                                            setLnurlLoading(false);
                                            if (result == null) {
                                                setAddressError("Invalid LNURL!");
                                                return;
                                            }
                                            const use = result;
                                            use.value = val;
                                            if (result.type === "pay") {
                                                setLnurlState(use);
                                                setKind("SoltoBTCLN");
                                                if (use.min.eq(use.max)) {
                                                    setAmount(new BigNumber(use.min.toString(10)).dividedBy(new BigNumber(100000000)).toFixed(8));
                                                }
                                            }
                                            if (result.type === "withdraw") {
                                                setLnurlState(use);
                                                setKind("BTCLNtoSol");
                                                setAmount(new BigNumber(BN.min(props.swapper.getMaximum(SwapType.FROM_BTCLN), use.max).toString(10)).dividedBy(new BigNumber(100000000)).toFixed(8));
                                                setVerifyAmount(true);
                                            }
                                        }).catch(e => {
                                            setAddressError("Invalid LNURL!");
                                        });
                                        return;
                                    }
                                    else {
                                        setLnurlState(null);
                                        setLnurlLoading(false);
                                    }
                                    return "Invalid lnurl-withdraw link!";
                                } })) : ""] })) : kind === "SoltoBTCLN" ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { inputRef: sendToRef, validated: addressError, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => {
                                        setScanning(true);
                                        scanningRef.current = true;
                                    } }, { children: _jsx(Icon, { icon: ic_qr_code_scanner, size: 32 }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                                    addressValidateCount.current++;
                                    setAddressError(null);
                                    if (val === "") {
                                        setLnurlLoading(false);
                                        setLnurlState(null);
                                        return "Cannot be empty";
                                    }
                                    const current = addressValidateCount.current;
                                    if (props.swapper.isValidLNURL(val)) {
                                        if (lnurlState != null && lnurlState.value === val)
                                            return null;
                                        setLnurlLoading(true);
                                        setLnurlState(null);
                                        props.swapper.getLNURLTypeAndData(val).then(result => {
                                            if (addressValidateCount.current != current)
                                                return;
                                            setLnurlLoading(false);
                                            if (result == null) {
                                                setAddressError("Invalid LNURL!");
                                                //TODO: Maybe some show error about unsupported, or not working lnurl
                                                return;
                                            }
                                            const use = result;
                                            use.value = val;
                                            if (result.type === "pay") {
                                                setLnurlState(use);
                                                if (use.min.eq(use.max)) {
                                                    setAmount(new BigNumber(use.min.toString(10)).dividedBy(new BigNumber(100000000)).toFixed(8));
                                                }
                                            }
                                            if (result.type === "withdraw") {
                                                setLnurlState(use);
                                                setKind("BTCLNtoSol");
                                                setAmount(new BigNumber(BN.min(props.swapper.getMaximum(SwapType.FROM_BTCLN), use.max).toString(10)).dividedBy(new BigNumber(100000000)).toFixed(8));
                                                setVerifyAmount(true);
                                            }
                                        }).catch(e => {
                                            setAddressError("Invalid LNURL!");
                                        });
                                        return;
                                    }
                                    else {
                                        setLnurlState(null);
                                        setLnurlLoading(false);
                                    }
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
                                } }), (lnurlState === null || lnurlState === void 0 ? void 0 : lnurlState.shortDescription) ? (_jsxs(Alert, Object.assign({ variant: "success" }, { children: [lnurlState.icon ? (_jsx("img", { src: lnurlState.icon })) : "", _jsx("span", { children: lnurlState.shortDescription })] }))) : "", lnurlState != null ? (_jsx(ValidatedInput, { disabled: step !== 0 || lnurlState.min.eq(lnurlState.max), inputRef: amountRef, className: "mt-1 strip-group-text mb-3", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                                    setAmount(val);
                                }, min: new BigNumber(BN.max(props.swapper.getMinimum(SwapType.TO_BTCLN), lnurlState.min).toString(10)).dividedBy(FEConstants.satsPerBitcoin), max: new BigNumber(BN.min(props.swapper.getMaximum(SwapType.TO_BTCLN), lnurlState.max).toString(10)).dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                                    return val === "" ? "Amount cannot be empty" : null;
                                } })) : "", (lnurlState === null || lnurlState === void 0 ? void 0 : lnurlState.commentMaxLength) > 0 ? (_jsx(ValidatedInput, { inputRef: commentRef, value: comment, onChange: setComment, className: "mb-3", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Comment" }))), placeholder: "Enter optional comment", onValidate: (val) => {
                                    return val.length > lnurlState.commentMaxLength ? "Maximum length of the comment is: " + lnurlState.commentMaxLength + " characters" : null;
                                } })) : ""] })) : (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { inputRef: sendToRef, className: "mb-4", type: "text", disabled: step !== 0, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Send to" }))), textEnd: (_jsx("a", Object.assign({ href: "javascript:void(0);", onClick: () => {
                                        setScanning(true);
                                        scanningRef.current = true;
                                    } }, { children: _jsx(Icon, { icon: ic_qr_code_scanner, size: 32 }) }))), size: "lg", value: address, onChange: setAddress, placeholder: "Enter destination address", onValidate: (val) => {
                                    if (val === "")
                                        return "Cannot be empty";
                                    if (!props.swapper.isValidBitcoinAddress(val))
                                        return "Invalid bitcoin address";
                                } }), _jsx(ValidatedInput, { disabled: step !== 0, inputRef: amountRef, className: "mt-1 strip-group-text", type: "number", value: amount, size: "lg", label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Enter amount" }))), onChange: (val) => {
                                    setAmount(val);
                                }, min: new BigNumber(props.swapper.getMinimum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), max: new BigNumber(props.swapper.getMaximum(SwapType.TO_BTC).toString(10)).dividedBy(FEConstants.satsPerBitcoin), step: new BigNumber("0.00000001"), onValidate: (val) => {
                                    return val === "" ? "Amount cannot be empty" : null;
                                } })] })), step === 1 ? (_jsxs(_Fragment, { children: [kind === "SoltoBTCLN" ? (_jsx(EVMtoBTCLNPanel, { token: token, amount: amount == null ? null : new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), bolt11PayReq: address, signer: props.signer, comment: comment, swapType: SwapType.TO_BTCLN, swapper: props.swapper })) : kind === "BTCLNtoSol" ? (_jsx(BTCLNtoEVMPanel, { token: token, lnurl: address, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.FROM_BTCLN, swapper: props.swapper })) : kind === "BTCtoSol" ? (_jsx(BTCLNtoEVMPanel, { token: token, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.FROM_BTC, swapper: props.swapper })) : (_jsx(EVMtoBTCLNPanel, { token: token, bolt11PayReq: address, amount: new BigNumber(amount).multipliedBy(FEConstants.satsPerBitcoin), signer: props.signer, swapType: SwapType.TO_BTC, swapper: props.swapper })), _jsx(Button, Object.assign({ className: "mt-3", variant: "secondary", size: "lg", onClick: () => {
                                    setStep(0);
                                } }, { children: "Back" }))] })) : (_jsx(Button, Object.assign({ className: "mt-3", size: "lg", onClick: () => {
                            if (!tokenRef.current.validate()) {
                                return;
                            }
                            if (kind === "BTCLNtoSol" || kind === "BTCtoSol") {
                                if (!amountRef.current.validate()) {
                                    return;
                                }
                                if (kind === "BTCLNtoSol") {
                                    if (!sendToRef.current.validate() || addressError != null) {
                                        return;
                                    }
                                }
                            }
                            else if (kind === "SoltoBTCLN") {
                                if (!sendToRef.current.validate()) {
                                    return;
                                }
                                if (props.swapper.isValidLNURL(sendToRef.current.getValue())) {
                                    if (addressError != null) {
                                        return;
                                    }
                                    if (!amountRef.current.validate()) {
                                        return;
                                    }
                                    if (lnurlState.commentMaxLength > 0)
                                        if (!commentRef.current.validate()) {
                                            return;
                                        }
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
