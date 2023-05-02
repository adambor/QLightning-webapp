import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import ValidatedInput from "./ValidatedInput";
import { Alert, Button, Spinner } from "react-bootstrap";
import QRCode from "qrcode.react";
import { FEConstants } from "../Constants";
import { BTCxtoSolSwapState, SwapType, BTCtoSolNewSwapState, BTCtoSolNewSwap, BTCLNtoSolSwap } from "evmlightning-sdk";
import * as BN from "bn.js";
export function BTCLNtoEVMClaim(props) {
    var _a, _b;
    const [sendingTx, setSendingTx] = useState(false);
    const [state, setState] = useState(0);
    const [txId, setTxId] = useState(null);
    const [confirmations, setConfirmations] = useState(null);
    const [targetConfirmations, setTargetConfirmations] = useState(null);
    const commit = async () => {
        setSendingTx(true);
        try {
            await props.swap.commit();
        }
        catch (e) {
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    const claim = async () => {
        setSendingTx(true);
        try {
            await props.swap.claim();
            props.onSuccess();
        }
        catch (e) {
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    const commitAndClaim = async () => {
        setSendingTx(true);
        try {
            await props.swap.commitAndClaim();
            props.onSuccess();
        }
        catch (e) {
            console.error(e);
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    useEffect(() => {
        if (props.swap == null)
            return;
        const _abortController = new AbortController();
        setState(props.swap.getState());
        if (props.swap.getState() === BTCxtoSolSwapState.PR_CREATED) {
            props.swap.waitForPayment(_abortController.signal, null).then(() => {
                //
            });
        }
        const listener = (swap) => {
            setState(swap.state);
        };
        props.swap.events.on("swapState", listener);
        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
        };
    }, [props.swap]);
    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.displayDecimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [state === BTCxtoSolSwapState.PR_CREATED && txId == null ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { className: "mb-4", type: "text", disabled: true, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Address" }))), size: null, value: (_a = props.swap) === null || _a === void 0 ? void 0 : _a.getAddress(), onValidate: (val) => {
                            return null;
                        }, copyEnabled: true }), _jsx(QRCode, { size: 256, value: (_b = props.swap) === null || _b === void 0 ? void 0 : _b.getQrData(), includeMargin: true, id: "qrCodeCanvas" })] })) : "", _jsx("b", { children: "Amount: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Fee: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Total received: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, state === BTCxtoSolSwapState.PR_CREATED ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), txId != null ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for confirmations..." }), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsx("b", { children: "Tx ID: " }), _jsx("small", { children: txId })] })), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsxs("b", { children: ["Confirmations: ", confirmations, "/", targetConfirmations] }), _jsxs("small", { children: ["You will be able to claim the funds once", _jsx("br", {}), "your bitcoin transaction gets ", targetConfirmations, " confirmations"] })] }))] })) : (_jsx("b", { children: "Waiting for payment..." }))] }))) : (state === BTCxtoSolSwapState.PR_PAID || state === BTCxtoSolSwapState.CLAIM_COMMITED) ? (_jsxs(_Fragment, { children: [state === BTCxtoSolSwapState.PR_PAID ? (_jsxs(Button, Object.assign({ onClick: commit, disabled: sendingTx }, { children: ["1. Begin claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] }))) : "", _jsxs(Button, Object.assign({ onClick: claim, disabled: sendingTx || state === BTCxtoSolSwapState.PR_PAID }, { children: [state === BTCxtoSolSwapState.PR_PAID ? "2. " : "", "Finish claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] }))] })) : state === BTCxtoSolSwapState.CLAIM_CLAIMED ? (_jsx(Alert, Object.assign({ variant: "success" }, { children: "Swap successful" }))) : (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" })))] })));
}
export function BTCtoEVMClaim(props) {
    var _a, _b;
    const [sendingTx, setSendingTx] = useState(false);
    const [state, setState] = useState(0);
    const [txId, setTxId] = useState(null);
    const [confirmations, setConfirmations] = useState(null);
    const [targetConfirmations, setTargetConfirmations] = useState(null);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const commit = async () => {
        setSendingTx(true);
        try {
            await props.swap.commit();
        }
        catch (e) {
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    const claim = async () => {
        setSendingTx(true);
        let success = false;
        try {
            await props.swap.claim();
            success = true;
            props.onSuccess();
        }
        catch (e) {
            console.error(e);
            if (typeof (e) === "string") {
                props.onError(e);
            }
            else {
                props.onError(e.message);
            }
        }
        setSendingTx(false);
    };
    useEffect(() => {
        if (props.swap == null)
            return;
        const _abortController = new AbortController();
        setState(props.swap.getState());
        const listenForPayment = () => {
            props.swap.waitForPayment(_abortController.signal, null, ((txId, confirmations, targetConfirmations) => {
                setTxId(txId);
                setConfirmations(confirmations);
                setTargetConfirmations(targetConfirmations);
            })).then(() => {
                //
            });
        };
        const checkTimeoutInterval = setInterval(() => {
            const msRemaining = props.swap.getTimeoutTime() - Date.now();
            setSecondsRemaining(Math.floor(msRemaining / 1000));
        }, 1000);
        if (props.swap.getState() === BTCtoSolNewSwapState.CLAIM_COMMITED) {
            listenForPayment();
        }
        const listener = (swap) => {
            setState(swap.state);
            if (swap.state === BTCtoSolNewSwapState.CLAIM_COMMITED) {
                listenForPayment();
            }
        };
        props.swap.events.on("swapState", listener);
        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
            clearInterval(checkTimeoutInterval);
        };
    }, [props.swap]);
    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.decimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [state === BTCtoSolNewSwapState.CLAIM_COMMITED && txId == null ? (_jsxs(_Fragment, { children: [_jsx(ValidatedInput, { className: "mb-4", type: "text", disabled: true, label: (_jsx("span", Object.assign({ className: "fw-semibold" }, { children: "Address" }))), size: null, value: (_a = props.swap) === null || _a === void 0 ? void 0 : _a.getAddress(), onValidate: (val) => {
                            return null;
                        }, copyEnabled: true }), _jsx(QRCode, { size: 256, value: (_b = props.swap) === null || _b === void 0 ? void 0 : _b.getQrData(), includeMargin: true, id: "qrCodeCanvas" })] })) : "", _jsx("b", { children: "Amount: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Fee: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, _jsx("b", { children: "Total received: " }), props.swap == null ? "0." + "0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol, state === BTCtoSolNewSwapState.CLAIM_COMMITED ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), txId != null ? (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for confirmations..." }), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsx("b", { children: "Tx ID: " }), _jsx("small", { children: txId })] })), _jsxs("div", Object.assign({ className: "mt-2 d-flex flex-column" }, { children: [_jsxs("b", { children: ["Confirmations: ", confirmations, "/", targetConfirmations] }), _jsxs("small", { children: ["You will be able to claim the funds once", _jsx("br", {}), "your bitcoin transaction gets ", targetConfirmations, " confirmations"] })] }))] })) : (_jsxs(_Fragment, { children: [_jsx("b", { children: "Waiting for payment..." }), _jsx("p", { children: "Make sure you send the transaction in time and with high enough fee!" }), _jsxs("p", { children: ["Seconds remaining: ", secondsRemaining] })] }))] }))) : (state === BTCtoSolNewSwapState.PR_CREATED) ? (_jsx(_Fragment, { children: _jsxs(Button, Object.assign({ onClick: commit, disabled: sendingTx }, { children: ["Begin claim of ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] })) })) : state === BTCtoSolNewSwapState.BTC_TX_CONFIRMED ? (_jsx(_Fragment, { children: _jsxs(Button, Object.assign({ onClick: claim, disabled: sendingTx }, { children: ["Claim ", props.swap == null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals), " ", tokenSymbol] })) })) : state === BTCtoSolNewSwapState.CLAIM_CLAIMED ? (_jsx(Alert, Object.assign({ variant: "success" }, { children: "Swap successful" }))) : (_jsx(Alert, Object.assign({ variant: "danger" }, { children: "Swap failed" })))] })));
}
function BTCLNtoEVMPanel(props) {
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [swap, setSwap] = useState(null);
    useEffect(() => {
        const _abortController = new AbortController();
        if (props.signer == null) {
            return;
        }
        setError(null);
        setLoading(true);
        setSwap(null);
        (async () => {
            if (props.amount != null) {
                try {
                    let createdSwap;
                    if (props.swapType === SwapType.FROM_BTCLN) {
                        createdSwap = await props.swapper.createBTCLNtoEVMSwap(props.token, new BN(props.amount.toString(10)));
                    }
                    if (props.swapType === SwapType.FROM_BTC) {
                        createdSwap = await props.swapper.createBTCtoEVMSwap(props.token, new BN(props.amount.toString(10)));
                    }
                    setSwap(createdSwap);
                    setLoading(false);
                }
                catch (e) {
                    console.log(e);
                    if (typeof (e) === "string") {
                        setError(e);
                    }
                    else {
                        setError(e.message);
                    }
                }
            }
        })();
        return () => {
            _abortController.abort();
        };
    }, [props.signer, props.amount]);
    return (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center" }, { children: [loading ? (_jsxs("div", Object.assign({ className: "d-flex flex-column justify-content-center align-items-center mt-4" }, { children: [_jsx(Spinner, { animation: "border" }), _jsx("b", { children: "Loading..." })] }))) : "", error != null ? (_jsx(Alert, Object.assign({ variant: "danger" }, { children: error }))) : "", swap != null ? (_jsx(_Fragment, { children: swap instanceof BTCLNtoSolSwap ? (_jsx(BTCLNtoEVMClaim, { signer: props.signer, swap: swap, onError: setError, onSuccess: () => {
                    } })) : swap instanceof BTCtoSolNewSwap ? (_jsx(BTCtoEVMClaim, { signer: props.signer, swap: swap, onError: setError, onSuccess: () => {
                    } })) : "" })) : ""] })));
}
export default BTCLNtoEVMPanel;
