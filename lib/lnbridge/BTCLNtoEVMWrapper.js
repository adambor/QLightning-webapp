import * as ethers from "ethers/lib/ethers";
import { BTCLNtoEVMCommitStatus, PaymentAuthError } from "./BTCLNtoEVM";
import BTCLNtoEVM from "./BTCLNtoEVM";
import * as bolt11 from "bolt11";
import BigNumber from "bignumber.js";
import { ConstantBTCLNtoEVM } from "../../src/Constants";
import * as EventEmitter from "events";
export const BTCLNtoEVMSwapState = {
    FAILED: -1,
    PR_CREATED: 0,
    PR_PAID: 1,
    CLAIM_COMMITED: 2,
    CLAIM_CLAIMED: 3,
};
export class BTCLNtoEVMSwap {
    constructor(wrapper, prOrObject, secret, url, fromAddress, minOut) {
        this.wrapper = wrapper;
        this.events = new EventEmitter();
        if (typeof (prOrObject) === "string") {
            this.state = BTCLNtoEVMSwapState.PR_CREATED;
            this.fromAddress = fromAddress;
            this.url = url;
            this.pr = prOrObject;
            this.secret = secret;
            this.minOut = minOut;
        }
        else {
            this.state = prOrObject.state;
            this.url = prOrObject.url;
            this.fromAddress = prOrObject.fromAddress;
            this.pr = prOrObject.pr;
            this.secret = Buffer.from(prOrObject.secret, "hex");
            this.minOut = ethers.BigNumber.from(prOrObject.minOut);
            this.intermediary = prOrObject.intermediary;
            this.data = prOrObject.data != null ? {
                intermediary: prOrObject.data.intermediary,
                token: prOrObject.data.token,
                amount: ethers.BigNumber.from(prOrObject.data.amount),
                paymentHash: prOrObject.data.paymentHash,
                expiry: ethers.BigNumber.from(prOrObject.data.expiry)
            } : null;
            this.prefix = prOrObject.prefix;
            this.timeout = prOrObject.timeout;
            this.signature = prOrObject.signature;
        }
    }
    getOutputAmount() {
        if (this.data != null)
            return this.data.amount;
        return this.minOut;
    }
    getInvoiceAmount() {
        const parsed = bolt11.decode(this.pr);
        return ethers.BigNumber.from(parsed.satoshis);
    }
    getFee() {
        return this.getInvoiceAmount().sub(this.getOutputAmount());
    }
    serialize() {
        return {
            state: this.state,
            url: this.url,
            fromAddress: this.fromAddress,
            pr: this.pr,
            secret: this.secret != null ? this.secret.toString("hex") : null,
            minOut: this.minOut != null ? this.minOut.toString() : null,
            intermediary: this.intermediary,
            data: this.data != null ? {
                intermediary: this.data.intermediary,
                token: this.data.token,
                amount: this.data.amount.toString(),
                paymentHash: this.data.paymentHash,
                expiry: this.data.expiry.toString()
            } : null,
            prefix: this.prefix,
            timeout: this.timeout,
            signature: this.signature
        };
    }
    save() {
        return this.wrapper.storage.saveSwapData(this);
    }
    async waitForPayment(abortSignal, checkIntervalSeconds) {
        if (this.state !== BTCLNtoEVMSwapState.PR_CREATED) {
            throw new Error("Must be in PR_CREATED state!");
        }
        const result = await this.wrapper.contract.waitForIncomingPaymentAuthorization(this.pr, this.minOut, this.url, this.fromAddress, abortSignal, checkIntervalSeconds);
        if (abortSignal.aborted)
            throw new Error("Aborted");
        this.state = BTCLNtoEVMSwapState.PR_PAID;
        this.intermediary = result.intermediary;
        this.data = result.data;
        this.prefix = result.prefix;
        this.timeout = result.timeout;
        this.signature = result.signature;
        await this.save();
        this.emitEvent();
    }
    canCommit() {
        return this.state === BTCLNtoEVMSwapState.PR_PAID;
    }
    async commit(signer, noWaitForConfirmation, abortSignal) {
        if (this.state !== BTCLNtoEVMSwapState.PR_PAID) {
            throw new Error("Must be in PR_PAID state!");
        }
        try {
            BTCLNtoEVM.isValidAuthorization(this.intermediary, this.data, this.timeout, this.prefix, this.signature);
        }
        catch (e) {
            const result = await this.wrapper.contract.getPaymentAuthorization(this.pr, this.minOut, this.url, this.fromAddress);
            this.intermediary = result.intermediary;
            this.data = result.data;
            this.prefix = result.prefix;
            this.timeout = result.timeout;
            this.signature = result.signature;
        }
        const tx = await this.wrapper.contract.createPayTxWithAuthorization(this.intermediary, this.data, this.timeout, this.prefix, this.signature);
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
                    if (swap.state === BTCLNtoEVMSwapState.CLAIM_COMMITED) {
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
        this.state = BTCLNtoEVMSwapState.CLAIM_COMMITED;
        await this.save();
        this.emitEvent();
        return txResult;
    }
    canClaim() {
        return this.state === BTCLNtoEVMSwapState.CLAIM_COMMITED;
    }
    async claim(signer, noWaitForConfirmation, abortSignal) {
        if (this.state !== BTCLNtoEVMSwapState.CLAIM_COMMITED) {
            throw new Error("Must be in CLAIM_COMMITED state!");
        }
        const tx = await this.wrapper.contract.createClaimTx(this.intermediary, this.data, this.secret);
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
                    if (swap.state === BTCLNtoEVMSwapState.CLAIM_CLAIMED) {
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
        this.state = BTCLNtoEVMSwapState.CLAIM_CLAIMED;
        await this.save();
        this.emitEvent();
        return txResult;
    }
    emitEvent() {
        this.wrapper.events.emit("swapState", this);
        this.events.emit("swapState", this);
    }
}
export class BTCLNtoEVMWrapperLocalStorage {
    constructor() {
        this.data = null;
    }
    loadIfNeeded() {
        if (this.data == null) {
            const completedTxt = window.localStorage.getItem("newSwaps-BTCLNtoEVM");
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
            returnObj[paymentHash] = new BTCLNtoEVMSwap(wrapper, this.data[paymentHash]);
        });
        return Promise.resolve(returnObj);
    }
    save() {
        this.loadIfNeeded();
        window.localStorage.setItem("newSwaps-BTCLNtoEVM", JSON.stringify(this.data));
        return Promise.resolve();
    }
}
class BTCLNtoEVMWrapper {
    constructor(storage, provider) {
        this.storage = storage;
        this.provider = provider;
        this.contract = new BTCLNtoEVM(provider);
        this.events = new EventEmitter();
    }
    async create(address, amount, expirySeconds, url) {
        const result = await this.contract.createBOLT11PaymentRequest(address, ethers.BigNumber.from(amount.toString(10)), expirySeconds, url);
        const parsed = bolt11.decode(result.pr);
        const swap = new BTCLNtoEVMSwap(this, result.pr, result.secret, url, address, ethers.BigNumber.from(amount.minus(this.calculateFeeForAmount(amount)).toString(10)));
        await swap.save();
        this.swapData[parsed.tagsObject.payment_hash] = swap;
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
                if (swap.state === BTCLNtoEVMSwapState.PR_PAID || swap.state === BTCLNtoEVMSwapState.PR_CREATED) {
                    swap.state = BTCLNtoEVMSwapState.CLAIM_COMMITED;
                    swap.intermediary = event.args.offerer;
                    swap.data = BTCLNtoEVM.structToAtomicSwap(event.args.data);
                    swapChanged = true;
                }
            }
            if (event.name === "Claimed") {
                if (swap.state === BTCLNtoEVMSwapState.PR_PAID || swap.state === BTCLNtoEVMSwapState.PR_CREATED || swap.state === BTCLNtoEVMSwapState.CLAIM_COMMITED) {
                    swap.state = BTCLNtoEVMSwapState.CLAIM_CLAIMED;
                    swapChanged = true;
                }
            }
            if (event.name === "Refunded") {
                if (swap.state === BTCLNtoEVMSwapState.PR_PAID || swap.state === BTCLNtoEVMSwapState.PR_CREATED || swap.state === BTCLNtoEVMSwapState.CLAIM_COMMITED) {
                    swap.state = BTCLNtoEVMSwapState.FAILED;
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
            if (eventQueue != null) {
                eventQueue.push(event);
                return;
            }
            processEvent(event);
        });
        const changedSwaps = {};
        for (let paymentHash in this.swapData) {
            const swap = this.swapData[paymentHash];
            if (swap.state === BTCLNtoEVMSwapState.PR_CREATED) {
                //Check if it's maybe already paid
                try {
                    const res = await this.contract.getPaymentAuthorization(swap.pr, swap.minOut, swap.url);
                    if (res != null) {
                        swap.state = BTCLNtoEVMSwapState.PR_PAID;
                        swap.data = res.data;
                        swap.prefix = res.prefix;
                        swap.intermediary = res.intermediary;
                        swap.timeout = res.timeout;
                        swap.signature = res.signature;
                        changedSwaps[paymentHash] = swap;
                    }
                }
                catch (e) {
                    console.error(e);
                    if (e instanceof PaymentAuthError) {
                        swap.state = BTCLNtoEVMSwapState.FAILED;
                        changedSwaps[paymentHash] = swap;
                    }
                }
            }
            if (swap.state === BTCLNtoEVMSwapState.PR_PAID) {
                //Check if it's already committed
                if (BTCLNtoEVM.isExpired(swap.data)) {
                    //Already expired, we can remove it
                    swap.state = BTCLNtoEVMSwapState.FAILED;
                    changedSwaps[paymentHash] = swap;
                }
                else if (await this.contract.isClaimable(swap.intermediary, swap.data)) {
                    //Already committed
                    swap.state = BTCLNtoEVMSwapState.CLAIM_COMMITED;
                    changedSwaps[paymentHash] = swap;
                }
            }
            if (swap.state === BTCLNtoEVMSwapState.CLAIM_COMMITED) {
                //Check if it's already successfully paid
                const commitStatus = await this.contract.getCommitStatus(swap.intermediary, swap.data);
                if (commitStatus === BTCLNtoEVMCommitStatus.PAID) {
                    swap.state = BTCLNtoEVMSwapState.CLAIM_CLAIMED;
                    changedSwaps[paymentHash] = swap;
                }
                if (commitStatus === BTCLNtoEVMCommitStatus.NOT_COMMITTED || commitStatus === BTCLNtoEVMCommitStatus.EXPIRED) {
                    swap.state = BTCLNtoEVMSwapState.FAILED;
                    changedSwaps[paymentHash] = swap;
                }
            }
        }
        for (let event of eventQueue) {
            processEvent(event);
        }
        eventQueue = null;
        await this.storage.saveSwapDataArr(Object.keys(changedSwaps).map(e => changedSwaps[e]));
        /*
        const requests = this.storage.getAllRequestData();

        console.log("requests: ", requests);

        const includedHashes = new Set();

        const claimableRequest: {
            data: AtomicSwapStruct,
            intermediary: string,
            timeout?: string,
            prefix?: string,
            signature?: string
        }[] = [];
        for(let commitment in requests) {
            const request = requests[commitment];
            request.data.expiry = ethers.BigNumber.from(request.data.expiry);
            request.data.amount = ethers.BigNumber.from(request.data.amount);
            if(BTCLNtoEVM.isExpired(request.data)) {
                //Already expired, we can remove it
                this.storage.concludeRequestData(request.intermediary,request.data,false);
            } else if(await this.contract.isClaimable(request.intermediary, request.data)) {
                claimableRequest.push(request);
                includedHashes.add(request.data.paymentHash.substring(2));
            }
        }

        const secrets = this.storage.getAllSecrets();

        let anyRemoved = false;

        for(let paymentHash in secrets) {
            const entry = secrets[paymentHash];
            const parsed = bolt11.decode(entry.pr);

            if(includedHashes.has(parsed.tagsObject.payment_hash)) continue;

            const sats = new BigNumber(parsed.millisatoshis).dividedBy(new BigNumber(1000)).integerValue(BigNumber.ROUND_DOWN);
            const fee = this.calculateFeeForAmount(sats);

            try {
                const res = await this.contract.getPaymentAuthorization(entry.pr, ethers.BigNumber.from(sats.minus(fee).toString(10)), entry.url);
                if(res!=null) {
                    claimableRequest.push(res);
                }
            } catch (e) {
                console.error(e);
                if(e instanceof PaymentAuthError) {
                    delete secrets[paymentHash];
                    anyRemoved = true;
                }
            }
        }

        if(anyRemoved) this.storage.setSecretData(secrets);

        return claimableRequest;
        */
    }
    calculateFeeForAmount(amount) {
        return ConstantBTCLNtoEVM.baseFee.plus(amount.multipliedBy(ConstantBTCLNtoEVM.fee)).integerValue(BigNumber.ROUND_CEIL);
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
            if (swap.state === BTCLNtoEVMSwapState.PR_CREATED || swap.state === BTCLNtoEVMSwapState.CLAIM_CLAIMED || swap.state === BTCLNtoEVMSwapState.FAILED) {
                continue;
            }
            returnArr.push(swap);
        }
        return returnArr;
    }
}
export default BTCLNtoEVMWrapper;
