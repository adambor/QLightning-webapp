import * as bolt11 from "bolt11";
import * as ethers from "ethers/lib/ethers";
import * as EventEmitter from "events";
import EVMtoBTCLN, { PaymentRequestStatus } from "./EVMtoBTCLN";
import BigNumber from "bignumber.js";
import { ConstantEVMtoBTCLN } from "../../src/Constants";
export const EVMtoBTCLNSwapState = {
    REFUNDED: -2,
    FAILED: -1,
    CREATED: 0,
    COMMITED: 1,
    CLAIMED: 2,
    REFUNDABLE: 3
};
export class EVMtoBTCLNSwap {
    constructor(wrapper, prOrObject, data, url, fromAddress) {
        this.wrapper = wrapper;
        this.events = new EventEmitter();
        if (typeof (prOrObject) === "string") {
            this.state = EVMtoBTCLNSwapState.CREATED;
            this.fromAddress = fromAddress;
            this.url = url;
            this.pr = prOrObject;
            this.data = data;
        }
        else {
            this.state = prOrObject.state;
            this.url = prOrObject.url;
            this.fromAddress = prOrObject.fromAddress;
            this.pr = prOrObject.pr;
            this.data = prOrObject.data != null ? {
                intermediary: prOrObject.data.intermediary,
                token: prOrObject.data.token,
                amount: ethers.BigNumber.from(prOrObject.data.amount),
                paymentHash: prOrObject.data.paymentHash,
                expiry: ethers.BigNumber.from(prOrObject.data.expiry)
            } : null;
        }
    }
    getOutputAmount() {
        return this.data.amount;
    }
    getInvoiceAmount() {
        const parsedPR = bolt11.decode(this.pr);
        return ethers.BigNumber.from(parsedPR.satoshis);
    }
    getFee() {
        return this.getOutputAmount().sub(this.getInvoiceAmount());
    }
    serialize() {
        return {
            state: this.state,
            url: this.url,
            fromAddress: this.fromAddress,
            pr: this.pr,
            data: this.data != null ? {
                intermediary: this.data.intermediary,
                token: this.data.token,
                amount: this.data.amount.toString(),
                paymentHash: this.data.paymentHash,
                expiry: this.data.expiry.toString()
            } : null,
        };
    }
    save() {
        return this.wrapper.storage.saveSwapData(this);
    }
    async waitForPayment(abortSignal, checkIntervalSeconds) {
        const result = await this.wrapper.contract.waitForRefundAuthorization(this.fromAddress, this.data, this.url, abortSignal, checkIntervalSeconds);
        if (abortSignal.aborted)
            throw new Error("Aborted");
        if (!result.is_paid) {
            this.state = EVMtoBTCLNSwapState.REFUNDABLE;
            await this.save();
            this.emitEvent();
            return false;
        }
        else {
            return true;
        }
    }
    canCommit() {
        return this.state === EVMtoBTCLNSwapState.CREATED;
    }
    async commit(signer, noWaitForConfirmation, abortSignal) {
        if (this.state !== EVMtoBTCLNSwapState.CREATED) {
            throw new Error("Must be in CREATED state!");
        }
        const tx = await this.wrapper.contract.createPayTx(this.fromAddress, this.data);
        //Maybe don't wait for TX but instead subscribe to logs, this would improve the experience when user speeds up the transaction by replacing it.
        const txResult = await signer.sendTransaction(tx);
        if (!noWaitForConfirmation) {
            return await new Promise((resolve, reject) => {
                if (abortSignal != null && abortSignal.aborted) {
                    reject("Aborted");
                    return;
                }
                let listener;
                listener = (swap) => {
                    if (swap.state === EVMtoBTCLNSwapState.COMMITED) {
                        this.events.removeListener("swapState", listener);
                        if (abortSignal != null)
                            abortSignal.onabort = null;
                        resolve(txResult);
                    }
                };
                this.events.on("swapState", listener);
                if (abortSignal != null)
                    abortSignal.onabort = () => {
                        this.events.removeListener("swapState", listener);
                        reject("Aborted");
                    };
            });
        }
        /*if(!noWaitForConfirmation) {
            const receipt = await txResult.wait(1);

            if(!receipt.status) throw new Error("Transaction execution failed");

            return receipt;
        }*/
        /*this.state = EVMtoBTCLNSwapState.COMMITED;

        await this.save();

        this.emitEvent();*/
        return txResult;
    }
    canRefund() {
        return this.state === EVMtoBTCLNSwapState.REFUNDABLE || EVMtoBTCLN.isExpired(this.data);
    }
    async refund(signer, noWaitForConfirmation, abortSignal) {
        if (this.state !== EVMtoBTCLNSwapState.REFUNDABLE && !EVMtoBTCLN.isExpired(this.data)) {
            throw new Error("Must be in REFUNDABLE state!");
        }
        let tx;
        if (EVMtoBTCLN.isExpired(this.data)) {
            tx = await this.wrapper.contract.createRefundTx(this.fromAddress, this.data);
        }
        else {
            const res = await this.wrapper.contract.getRefundAuthorization(this.fromAddress, this.data, this.url);
            if (res.is_paid) {
                throw new Error("Payment was successful");
            }
            tx = await this.wrapper.contract.createRefundTxWithAuthorization(this.fromAddress, this.data, res.timeout, res.prefix, res.signature);
        }
        //Maybe don't wait for TX but instead subscribe to logs, this would improve the experience when user speeds up the transaction by replacing it.
        const txResult = await signer.sendTransaction(tx);
        if (!noWaitForConfirmation) {
            return await new Promise((resolve, reject) => {
                if (abortSignal != null && abortSignal.aborted) {
                    reject("Aborted");
                    return;
                }
                let listener;
                listener = (swap) => {
                    if (swap.state === EVMtoBTCLNSwapState.REFUNDED) {
                        this.events.removeListener("swapState", listener);
                        if (abortSignal != null)
                            abortSignal.onabort = null;
                        resolve(txResult);
                    }
                };
                this.events.on("swapState", listener);
                if (abortSignal != null)
                    abortSignal.onabort = () => {
                        this.events.removeListener("swapState", listener);
                        reject("Aborted");
                    };
            });
        }
        /*if(!noWaitForConfirmation) {
            const receipt = await txResult.wait(1);

            if(!receipt.status) throw new Error("Transaction execution failed");

            return receipt;
        }*/
        /*this.state = EVMtoBTCLNSwapState.REFUNDED;

        await this.save();

        this.emitEvent();*/
        return txResult;
    }
    emitEvent() {
        this.wrapper.events.emit("swapState", this);
        this.events.emit("swapState", this);
    }
}
export class EVMtoBTCLNWrapperLocalStorage {
    constructor() {
        this.data = null;
    }
    loadIfNeeded() {
        if (this.data == null) {
            const completedTxt = window.localStorage.getItem("newSwaps-EVMtoBTCLN");
            if (completedTxt != null) {
                this.data = JSON.parse(completedTxt);
                if (this.data == null)
                    this.data = {};
            }
            else {
                this.data = {};
            }
        }
    }
    removeSwapData(swap) {
        this.loadIfNeeded();
        const parsed = bolt11.decode(swap.pr);
        if (this.data[parsed.tagsObject.payment_hash] != null) {
            delete this.data[parsed.tagsObject.payment_hash];
            return this.save().then(() => true);
        }
        return Promise.resolve(false);
    }
    saveSwapData(swap) {
        this.loadIfNeeded();
        const parsed = bolt11.decode(swap.pr);
        this.data[parsed.tagsObject.payment_hash] = swap.serialize();
        return this.save();
    }
    saveSwapDataArr(swapData) {
        this.loadIfNeeded();
        for (let swap of swapData) {
            const parsed = bolt11.decode(swap.pr);
            this.data[parsed.tagsObject.payment_hash] = swap.serialize();
        }
        return this.save();
    }
    loadSwapData(wrapper) {
        this.loadIfNeeded();
        const returnObj = {};
        Object.keys(this.data).forEach(paymentHash => {
            returnObj[paymentHash] = new EVMtoBTCLNSwap(wrapper, this.data[paymentHash]);
        });
        return Promise.resolve(returnObj);
    }
    save() {
        this.loadIfNeeded();
        window.localStorage.setItem("newSwaps-EVMtoBTCLN", JSON.stringify(this.data));
        return Promise.resolve();
    }
}
class EVMtoBTCLNWrapper {
    constructor(storage, provider) {
        this.storage = storage;
        this.provider = provider;
        this.contract = new EVMtoBTCLN(provider);
        this.events = new EventEmitter();
    }
    static calculateFeeForAmount(amount) {
        return ConstantEVMtoBTCLN.baseFee.plus(amount.multipliedBy(ConstantEVMtoBTCLN.fee)).integerValue(BigNumber.ROUND_CEIL);
    }
    async create(address, bolt11PayRequest, expirySeconds, url) {
        const parsedPR = bolt11.decode(bolt11PayRequest);
        if (parsedPR.satoshis == null) {
            throw new Error("Must be an invoice with amount!");
        }
        const sats = new BigNumber(parsedPR.millisatoshis).dividedBy(new BigNumber(1000)).integerValue();
        const fee = EVMtoBTCLNWrapper.calculateFeeForAmount(sats);
        const result = await this.contract.payBOLT11PaymentRequest(bolt11PayRequest, expirySeconds, ethers.BigNumber.from(fee.toString(10)), url);
        const swap = new EVMtoBTCLNSwap(this, bolt11PayRequest, result.data, url, address);
        await swap.save();
        this.swapData[result.data.paymentHash.substring(2)] = swap;
        return swap;
    }
    async init() {
        let eventQueue = [];
        this.swapData = await this.storage.loadSwapData(this);
        const processEvent = (event) => {
            const paymentHash = event.args.paymentHash.substring(2);
            const swap = this.swapData[paymentHash];
            if (swap == null)
                return;
            let swapChanged = false;
            if (event.name === "PaymentRequest") {
                if (swap.state === EVMtoBTCLNSwapState.CREATED) {
                    swap.state = EVMtoBTCLNSwapState.COMMITED;
                    swapChanged = true;
                }
            }
            if (event.name === "Claimed") {
                if (swap.state === EVMtoBTCLNSwapState.CREATED || swap.state === EVMtoBTCLNSwapState.COMMITED || swap.state === EVMtoBTCLNSwapState.REFUNDABLE) {
                    swap.state = EVMtoBTCLNSwapState.CLAIMED;
                    swapChanged = true;
                }
            }
            if (event.name === "Refunded") {
                if (swap.state === EVMtoBTCLNSwapState.CREATED || swap.state === EVMtoBTCLNSwapState.COMMITED || swap.state === EVMtoBTCLNSwapState.REFUNDABLE) {
                    swap.state = EVMtoBTCLNSwapState.REFUNDED;
                    swapChanged = true;
                }
            }
            if (swapChanged) {
                if (eventQueue == null) {
                    swap.save().then(() => {
                        swap.emitEvent();
                    });
                }
            }
        };
        this.provider.on({
            address: this.contract.contract.address
        }, (log) => {
            const event = this.contract.contract.interface.parseLog(log);
            console.log("Event: ", event);
            if (eventQueue != null) {
                eventQueue.push(event);
                return;
            }
            processEvent(event);
        });
        const changedSwaps = {};
        for (let paymentHash in this.swapData) {
            const swap = this.swapData[paymentHash];
            if (swap.state === EVMtoBTCLNSwapState.CREATED) {
                //Check if it's already committed
                const res = await this.contract.getCommitStatus(swap.fromAddress, swap.data);
                if (res === PaymentRequestStatus.PAID) {
                    swap.state = EVMtoBTCLNSwapState.CLAIMED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.EXPIRED) {
                    swap.state = EVMtoBTCLNSwapState.FAILED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.PAYING) {
                    swap.state = EVMtoBTCLNSwapState.COMMITED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.REFUNDABLE) {
                    swap.state = EVMtoBTCLNSwapState.REFUNDABLE;
                    changedSwaps[paymentHash] = swap;
                }
            }
            if (swap.state === EVMtoBTCLNSwapState.COMMITED) {
                const res = await this.contract.getCommitStatus(swap.fromAddress, swap.data);
                if (res === PaymentRequestStatus.PAYING) {
                    //Check if that maybe already concluded
                    const refundAuth = await this.contract.getRefundAuthorization(swap.fromAddress, swap.data, swap.url);
                    if (refundAuth != null) {
                        if (!refundAuth.is_paid) {
                            swap.state = EVMtoBTCLNSwapState.REFUNDABLE;
                            changedSwaps[paymentHash] = swap;
                        }
                    }
                }
                if (res === PaymentRequestStatus.NOT_FOUND) {
                    swap.state = EVMtoBTCLNSwapState.REFUNDED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.PAID) {
                    swap.state = EVMtoBTCLNSwapState.CLAIMED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.EXPIRED) {
                    swap.state = EVMtoBTCLNSwapState.FAILED;
                    changedSwaps[paymentHash] = swap;
                }
                if (res === PaymentRequestStatus.REFUNDABLE) {
                    swap.state = EVMtoBTCLNSwapState.REFUNDABLE;
                    changedSwaps[paymentHash] = swap;
                }
            }
        }
        for (let event of eventQueue) {
            processEvent(event);
        }
        eventQueue = null;
        await this.storage.saveSwapDataArr(Object.keys(changedSwaps).map(e => changedSwaps[e]));
    }
    async getClaimableRequests(signer) {
        const signerAddress = await signer.getAddress();
        const returnArr = [];
        for (let paymentHash in this.swapData) {
            const swap = this.swapData[paymentHash];
            console.log(swap);
            if (swap.fromAddress.toLowerCase() !== signerAddress.toLowerCase()) {
                continue;
            }
            if (swap.state === EVMtoBTCLNSwapState.REFUNDABLE) {
                returnArr.push(swap);
            }
        }
        return returnArr;
    }
}
export default EVMtoBTCLNWrapper;
