import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import * as React from "react";
import ValidatedInput from "./ValidatedInput";
import {Alert, Button, Spinner} from "react-bootstrap";
import QRCode from "qrcode.react";
import {FEConstants} from "../Constants";
import {IBTCxtoSolSwap, BTCxtoSolSwapState, EVMSwapper, SwapType, BTCtoSolNewSwapState, BTCtoSolNewSwap, BTCLNtoSolSwap} from "evmlightning-sdk";
import {Signer} from "ethers";
import * as BN from "bn.js";

export function BTCLNtoEVMClaim(props: {
    signer: Signer,
    onError: (string) => any,
    onSuccess: () => any,
    swap: BTCLNtoSolSwap<any>
}) {

    const [sendingTx, setSendingTx] = useState<boolean>(false);

    const [state, setState] = useState<number>(0);

    const [expired, setExpired] = useState<boolean>(false);
    const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            const now = Date.now();
            if(props.swap.getState()===BTCxtoSolSwapState.PR_PAID) {
                if(props.swap.getExpiry()<now && !sendingTx) {
                    props.onError("Swap expired!");
                    if(timer!=null) clearInterval(timer);
                    setExpired(true);
                    timer = null;
                    return;
                }
            }
            setCurrentTimestamp(now);
        }, 500);

        return () => {
            if(timer!=null) clearInterval(timer);
        }
    }, [props.swap]);

    const commit = async() => {
        setSendingTx(true);

        try {
            await props.swap.commit();
        } catch (e) {
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);
    };

    const claim = async() => {
        setSendingTx(true);

        try {
            await props.swap.claim();
            props.onSuccess();
        } catch (e) {
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);
    };

    useEffect(() => {

        if(props.swap==null) return;

        const _abortController = new AbortController();

        setState(props.swap.getState());

        if(props.swap.getState()===BTCxtoSolSwapState.PR_CREATED) {
            props.swap.waitForPayment(_abortController.signal, null).then(() => {
                //
            }).catch(e => {
                props.onError("Receiving error:"+e.message);
            });
        }

        const listener = (swap) => {
            setState(swap.state);
        };

        props.swap.events.on("swapState", listener);

        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
        }

    }, [props.swap]);

    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.displayDecimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));

    const nativeTokenData = FEConstants.tokenData[props.swap.getWrapper().contract.swapContract.getNativeCurrencyAddress().toString()];
    const nativeTokenSymbol = nativeTokenData.symbol;
    const nativeTokenDecimals = nativeTokenData.decimals;
    const nativeTokenDivisor = new BigNumber(10).pow(new BigNumber(nativeTokenData.decimals));

    return (
        <div className="d-flex flex-column justify-content-center align-items-center">
            {state===BTCxtoSolSwapState.PR_CREATED ? (props.swap.isLNURL() ? (
                <>
                    <b>Receiving through LNURL-withdraw</b>
                </>
            ) : (
                <>
                    <ValidatedInput
                        className="mb-4"
                        type="text"
                        disabled={true}
                        label={(
                            <span className="fw-semibold">Address</span>
                        )}
                        size={null}
                        value={props.swap?.getAddress()}
                        onValidate={(val: any) => {
                            return null;
                        }}
                        copyEnabled={true}
                    />
                    <QRCode
                        size={256}
                        value={props.swap?.getQrData()}
                        includeMargin={true}
                        id={"qrCodeCanvas"}
                    />
                </>
            )) : ""}

            <b>Security deposit: </b>
            {props.swap==null ? "0."+"0".repeat(nativeTokenDecimals) : new BigNumber(props.swap.getSecurityDeposit().toString()).dividedBy(nativeTokenDivisor).toFixed(nativeTokenDecimals)} {nativeTokenSymbol}
            <small>(Returned back to you upon successful swap)</small>

            <b>Amount: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Fee: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Total received: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}

            {state===BTCxtoSolSwapState.PR_CREATED ? (
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    <Spinner animation="border" />
                    <b>Waiting for payment...</b>
                </div>
            ) : (state===BTCxtoSolSwapState.PR_PAID || state===BTCxtoSolSwapState.CLAIM_COMMITED) ? (
                <>
                    {state===BTCxtoSolSwapState.PR_PAID && !sendingTx ? (
                        <>
                            <b>Expires in: </b>{props.swap==null ? "0" : Math.floor((props.swap.getExpiry()-currentTimestamp)/1000)} seconds
                        </>
                    ) : ""}

                    {state===BTCxtoSolSwapState.PR_PAID ? (
                        <Button onClick={commit} disabled={sendingTx || expired}>
                            1. Begin claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
                        </Button>
                    ) : ""}

                    <Button onClick={claim} disabled={sendingTx || state===BTCxtoSolSwapState.PR_PAID || expired}>
                        {state===BTCxtoSolSwapState.PR_PAID ? "2. " : ""}Finish claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
                    </Button>
                </>
            ) : state===BTCxtoSolSwapState.CLAIM_CLAIMED ? (
                <Alert variant="success">
                    Swap successful
                </Alert>
            ) : (
                <Alert variant="danger">
                    Swap failed
                </Alert>
            )}

        </div>
    )

}

export function BTCtoEVMClaim(props: {
    signer: Signer,
    onError: (string) => any,
    onSuccess: () => any,
    swap: BTCtoSolNewSwap<any>
}) {

    const [sendingTx, setSendingTx] = useState<boolean>(false);

    const [state, setState] = useState<number>(0);

    const [txId, setTxId] = useState<string>(null);
    const [confirmations, setConfirmations] = useState<number>(null);
    const [targetConfirmations, setTargetConfirmations] = useState<number>(null);

    const [secondsRemaining, setSecondsRemaining] = useState<number>(null);

    const [expired, setExpired] = useState<boolean>(false);
    const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            const now = Date.now();
            if(props.swap.getState()===BTCtoSolNewSwapState.PR_CREATED) {
                console.log("State: PR_CREATED", props.swap);
                if(props.swap.getExpiry()<now && !sendingTx) {
                    props.onError("Swap expired!");
                    if(timer!=null) clearInterval(timer);
                    setExpired(true);
                    timer = null;
                    return;
                }
            }
            setCurrentTimestamp(now);
        }, 500);

        return () => {
            if(timer!=null) clearInterval(timer);
        }
    }, [props.swap]);

    const commit = async() => {
        setSendingTx(true);

        try {
            await props.swap.commit();
        } catch (e) {
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);
    };

    const claim = async() => {
        setSendingTx(true);

        let success = false;
        try {
            await props.swap.claim();
            success = true;
            props.onSuccess();
        } catch (e) {
            console.error(e);
            if(typeof(e)==="string") {
                props.onError(e);
            } else {
                props.onError(e.message);
            }
        }

        setSendingTx(false);
    };

    useEffect(() => {

        if(props.swap==null) return;

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
            const msRemaining = props.swap.getTimeoutTime()-Date.now();
            setSecondsRemaining(Math.floor(msRemaining/1000));
        }, 1000);

        if(props.swap.getState()===BTCtoSolNewSwapState.CLAIM_COMMITED) {
            listenForPayment();
        }

        const listener = (swap) => {
            setState(swap.state);
            if(swap.state===BTCtoSolNewSwapState.CLAIM_COMMITED) {
                listenForPayment();
            }
        };

        props.swap.events.on("swapState", listener);

        return () => {
            _abortController.abort();
            props.swap.events.removeListener("swapState", listener);
            clearInterval(checkTimeoutInterval);
        }

    }, [props.swap]);

    const tokenData = FEConstants.tokenData[props.swap.data.getToken().toString()];
    const tokenSymbol = tokenData.symbol;
    const tokenDecimals = tokenData.decimals;
    const tokenDivisor = new BigNumber(10).pow(new BigNumber(tokenData.decimals));

    const nativeTokenData = FEConstants.tokenData[props.swap.getWrapper().contract.swapContract.getNativeCurrencyAddress().toString()];
    const nativeTokenSymbol = nativeTokenData.symbol;
    const nativeTokenDecimals = nativeTokenData.decimals;
    const nativeTokenDivisor = new BigNumber(10).pow(new BigNumber(nativeTokenData.decimals));

    return (
        <div className="d-flex flex-column justify-content-center align-items-center">
            {state===BTCtoSolNewSwapState.CLAIM_COMMITED && txId==null ? (
                <>
                    <ValidatedInput
                        className="mb-4"
                        type="text"
                        disabled={true}
                        label={(
                            <span className="fw-semibold">Address</span>
                        )}
                        size={null}
                        value={props.swap?.getAddress()}
                        onValidate={(val: any) => {
                            return null;
                        }}
                        copyEnabled={true}
                    />
                    <QRCode
                        size={256}
                        value={props.swap?.getQrData()}
                        includeMargin={true}
                        id={"qrCodeCanvas"}
                    />
                </>
            ) : ""}

            <b>Security deposit: </b>
            {props.swap==null ? "0."+"0".repeat(nativeTokenDecimals) : new BigNumber(props.swap.getTotalDeposit().toString()).dividedBy(nativeTokenDivisor).toFixed(nativeTokenDecimals)} {nativeTokenSymbol}
            <small>(Returned back to you upon successful swap)</small>

            <b>Relayer fee: </b>
            {props.swap==null ? "0."+"0".repeat(nativeTokenDecimals) : new BigNumber(props.swap.getClaimerBounty().toString()).dividedBy(nativeTokenDivisor).toFixed(nativeTokenDecimals)} {nativeTokenSymbol}
            <small>(Fee for swap watchtowers)</small>

            <b>Amount: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmountWithoutFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Fee: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getFee().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
            <b>Total received: </b>{props.swap==null ? "0."+"0".repeat(tokenDecimals) : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}

            {state===BTCtoSolNewSwapState.CLAIM_COMMITED ? (
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    <Spinner animation="border" />
                    {txId!=null ? (
                        <>
                            <b>Waiting for confirmations...</b>
                            <div className="mt-2 d-flex flex-column">
                                <b>Tx ID: </b>
                                <small>{txId}</small>
                            </div>
                            <div className="mt-2 d-flex flex-column">
                                <b>Confirmations: {confirmations}/{targetConfirmations}</b>
                                <small>You will be able to claim the funds once<br/>your bitcoin transaction gets {targetConfirmations} confirmations</small>
                            </div>
                        </>
                    ) : (
                        <>
                            <b>Waiting for payment...</b>
                            <p>Make sure you send the transaction in time and with high enough fee!</p>
                            <p>Seconds remaining: {secondsRemaining}</p>
                        </>
                    )}
                </div>
            ) : (state===BTCtoSolNewSwapState.PR_CREATED) ? (
                <>
                    {/*{isBeginRequired ? (*/}
                    {/*<Button onClick={commit} disabled={sendingTx || claimBegun}>*/}
                    {/*1. Begin claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(Bitcoin.satsMultiplier).toFixed(8)} BTC*/}
                    {/*</Button>*/}
                    {/*) : ""}*/}

                    {/*<Button onClick={claim} disabled={sendingTx || (isBeginRequired ? !claimBegun : false)}>*/}
                    {/*{isBeginRequired ? "2. " : ""}Finish claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(Bitcoin.satsMultiplier).toFixed(8)} BTC*/}
                    {/*</Button>*/}

                    {!sendingTx ? (
                        <>
                            <b>Expires in: </b>{props.swap==null ? "0" : Math.floor((props.swap.getExpiry()-currentTimestamp)/1000)} seconds
                        </>
                    ) : ""}
                    <Button onClick={commit} disabled={sendingTx || expired}>
                        Begin claim of {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
                    </Button>
                </>
            ) : state===BTCtoSolNewSwapState.BTC_TX_CONFIRMED ? (
                <>
                    <Button onClick={claim} disabled={sendingTx}>
                        Claim {props.swap==null ? "" : new BigNumber(props.swap.getOutAmount().toString()).dividedBy(tokenDivisor).toFixed(tokenDecimals)} {tokenSymbol}
                    </Button>
                </>
            ) : state===BTCtoSolNewSwapState.CLAIM_CLAIMED ? (
                <Alert variant="success">
                    Swap successful
                </Alert>
            ) : (
                <Alert variant="danger">
                    Swap failed
                </Alert>
            )}

        </div>
    )

}

function BTCLNtoEVMPanel(props: {
    token: string,
    lnurl?: string,
    amount: BigNumber,
    signer: Signer,
    swapper: EVMSwapper,
    swapType: SwapType.FROM_BTC | SwapType.FROM_BTCLN
}) {

    const [loading, setLoading] = useState<boolean>(null);
    const [error, setError] = useState<string>(null);

    const [swap, setSwap] = useState<any>(null);

    useEffect(() => {
        const _abortController = new AbortController();

        if(props.signer==null) {
            return;
        }

        setError(null);
        setLoading(true);
        setSwap(null);

        (async () => {
            if(props.amount!=null) {
                try {
                    let createdSwap;
                    if(props.swapType===SwapType.FROM_BTCLN) {
                        if(props.lnurl!=null && props.lnurl!=="") {
                            console.log("Creating swap with lnurl: ", props.lnurl);
                            createdSwap = await props.swapper.createBTCLNtoEVMSwapViaLNURL(props.lnurl, props.token, new BN(props.amount.toString(10)));
                        } else {
                            createdSwap = await props.swapper.createBTCLNtoEVMSwap(props.token, new BN(props.amount.toString(10)));
                        }
                    }
                    if(props.swapType===SwapType.FROM_BTC) {
                        createdSwap = await props.swapper.createBTCtoEVMSwap(props.token, new BN(props.amount.toString(10)));
                    }
                    setSwap(createdSwap);
                    setLoading(false);
                } catch (e) {
                    console.log(e);
                    if(typeof(e)==="string") {
                        setError(e);
                    } else {
                        setError(e.message);
                    }
                }
            }
        })();

        return () => {
            _abortController.abort();
        };
    }, [props.swapper, props.signer, props.amount, props.lnurl]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center">
            {loading ? (
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    <Spinner animation="border" />
                    <b>Loading...</b>
                </div>
            ) : ""}

            {error!=null ? (
                <Alert variant="danger">
                    {error}
                </Alert>
            ) : ""}

            {swap!=null ? (
                <>
                    {swap instanceof BTCLNtoSolSwap ? (
                        <BTCLNtoEVMClaim signer={props.signer} swap={swap} onError={setError} onSuccess={() => {

                        }}/>
                    ) : swap instanceof BTCtoSolNewSwap ? (
                        <BTCtoEVMClaim signer={props.signer} swap={swap} onError={setError} onSuccess={() => {

                        }}/>
                    ) : ""}
                </>
            ) : ""}
        </div>
    )

}

export default BTCLNtoEVMPanel;