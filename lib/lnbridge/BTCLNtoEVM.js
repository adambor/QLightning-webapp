import * as ethers from "ethers/lib/ethers";
import fetch from "cross-fetch";
import * as bolt11 from "bolt11";
import btclntoevmContract from "./contracts/btclntoevmContract";
import wbtcContractData from "./contracts/wbtcContract";
import { createHash, randomBytes } from "crypto-browserify";
import { ConstantBTCLNtoEVM } from "../../src/Constants";
import { Buffer } from "buffer";
const timeoutPromise = (timeoutSeconds) => {
    return new Promise(resolve => {
        setTimeout(resolve, timeoutSeconds * 1000);
    });
};
const MIN_TIME_TO_CONFIRM = ConstantBTCLNtoEVM.claimGracePeriod;
export class PaymentAuthError extends Error {
    constructor(msg, code, data) {
        super(msg);
        this.data = data;
        this.code = code;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, PaymentAuthError.prototype);
    }
    getCode() {
        return this.code;
    }
    getData() {
        return this.data;
    }
}
export const BTCLNtoEVMCommitStatus = {
    EXPIRED: 0,
    NOT_COMMITTED: 1,
    COMMITTED: 2,
    PAID: 3
};
class BTCLNtoEVM {
    static structToAtomicSwap(data) {
        return {
            intermediary: data[0],
            token: data[1],
            amount: data[2],
            paymentHash: data[3],
            expiry: data[4]
        };
    }
    static atomicSwapToStruct(data) {
        return [
            data.intermediary,
            data.token,
            data.amount,
            data.paymentHash,
            data.expiry
        ];
    }
    constructor(provider) {
        this.provider = provider;
        this.contract = new ethers.Contract(btclntoevmContract.address, btclntoevmContract.abi, provider);
        this.wbtcContract = new ethers.Contract(wbtcContractData.address, wbtcContractData.abi, provider);
    }
    static getCommitmentFor(intermediary, data) {
        const encoded = ethers.utils.defaultAbiCoder.encode([
            "address",
            "tuple(address,address,uint256,bytes32,uint64)"
        ], [
            intermediary,
            BTCLNtoEVM.atomicSwapToStruct(data)
        ]);
        return ethers.utils.solidityKeccak256(["bytes"], [encoded]);
    }
    static isExpired(data) {
        const currentTimestamp = ethers.BigNumber.from(Math.floor(Date.now() / 1000) + ConstantBTCLNtoEVM.claimGracePeriod);
        return data.expiry.lt(currentTimestamp);
    }
    async getCommitStatus(intermediary, data) {
        //Check if is commited
        const commitment = await this.contract.getCommitment(data.paymentHash);
        console.log("Commitment: ", commitment);
        if (ethers.BigNumber.from(commitment).eq(ethers.BigNumber.from(1)))
            return BTCLNtoEVMCommitStatus.PAID;
        if (BTCLNtoEVM.isExpired(data)) {
            return BTCLNtoEVMCommitStatus.EXPIRED;
        }
        const hash = BTCLNtoEVM.getCommitmentFor(intermediary, data);
        const isCorrectCommitment = commitment.toLowerCase() === hash.toLowerCase();
        return isCorrectCommitment ?
            BTCLNtoEVMCommitStatus.COMMITTED :
            BTCLNtoEVMCommitStatus.NOT_COMMITTED;
    }
    async isClaimable(intermediary, data) {
        if (BTCLNtoEVM.isExpired(data)) {
            return false;
        }
        //Check if is commited
        const commitment = await this.contract.getCommitment(data.paymentHash);
        const hash = BTCLNtoEVM.getCommitmentFor(intermediary, data);
        console.log("Commitment: ", hash);
        const isCorrectCommitment = commitment.toLowerCase() === hash.toLowerCase();
        return isCorrectCommitment;
    }
    async createBOLT11PaymentRequest(address, amount, expirySeconds, url) {
        const secret = randomBytes(32);
        const paymentHash = createHash("sha256").update(secret).digest();
        const response = await fetch(url + "/createInvoice", {
            method: "POST",
            body: JSON.stringify({
                paymentHash: paymentHash.toString("hex"),
                amount: amount.toString(),
                expiry: expirySeconds,
                address
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.status !== 200) {
            let resp;
            try {
                resp = await response.text();
            }
            catch (e) {
                throw new Error(response.statusText);
            }
            throw new Error(resp);
        }
        let jsonBody = await response.json();
        const decodedPR = bolt11.decode(jsonBody.data.pr);
        if (!ethers.BigNumber.from(decodedPR.millisatoshis).div(ethers.BigNumber.from(1000)).eq(amount))
            throw new Error("Invalid payment request returned, amount mismatch");
        return {
            secret,
            pr: jsonBody.data.pr
        };
    }
    async getInvoiceStatus(bolt11PaymentReq, url, abortSignal) {
        const decodedPR = bolt11.decode(bolt11PaymentReq);
        const paymentHash = decodedPR.tagsObject.payment_hash;
        const response = await fetch(url + "/getInvoicePaymentAuth", {
            method: "POST",
            body: JSON.stringify({
                paymentHash: paymentHash
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (abortSignal != null && abortSignal.aborted)
            throw new Error("Aborted");
        if (response.status !== 200) {
            let resp;
            try {
                resp = await response.text();
            }
            catch (e) {
                throw new Error(response.statusText);
            }
            throw new Error(resp);
        }
        let jsonBody = await response.json();
        if (jsonBody.code === 10000) {
            return true;
        }
        if (jsonBody.code === 10003) {
            //Yet unpaid
            return false;
        }
        throw new PaymentAuthError(jsonBody.msg, jsonBody.code);
    }
    async getPaymentAuthorization(bolt11PaymentReq, minOut, url, address, abortSignal) {
        const decodedPR = bolt11.decode(bolt11PaymentReq);
        const paymentHash = decodedPR.tagsObject.payment_hash;
        const response = await fetch(url + "/getInvoicePaymentAuth", {
            method: "POST",
            body: JSON.stringify({
                paymentHash: paymentHash
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (abortSignal != null && abortSignal.aborted)
            throw new Error("Aborted");
        if (response.status !== 200) {
            let resp;
            try {
                resp = await response.text();
            }
            catch (e) {
                throw new Error(response.statusText);
            }
            throw new Error(resp);
        }
        let jsonBody = await response.json();
        if (jsonBody.code === 10000) {
            //Authorization returned
            jsonBody.data.data[2] = ethers.BigNumber.from(jsonBody.data.data[2]);
            jsonBody.data.data[4] = ethers.BigNumber.from(jsonBody.data.data[4]);
            const data = BTCLNtoEVM.structToAtomicSwap(jsonBody.data.data);
            if (address != null) {
                if (data.intermediary.toLowerCase() !== address.toLowerCase()) {
                    console.error("[EVM.PaymentRequest] Invalid to address used");
                    throw new PaymentAuthError("Invalid address used");
                }
            }
            const tokenAddress = data.token;
            if (tokenAddress.toLowerCase() !== wbtcContractData.address.toLowerCase()) {
                console.error("[EVM.PaymentRequest] Invalid token used");
                throw new PaymentAuthError("Invalid token used");
            }
            BTCLNtoEVM.isValidAuthorization(jsonBody.data.address, data, jsonBody.data.timeout, jsonBody.data.prefix, jsonBody.data.signature);
            const paymentHashInTx = data.paymentHash.substring(2).toLowerCase();
            console.log("[EVM.PaymentRequest] lightning payment hash: ", paymentHashInTx);
            if (paymentHashInTx !== paymentHash.toLowerCase()) {
                console.error("[EVM.PaymentRequest] lightning payment request mismatch");
                throw (new PaymentAuthError("Lightning payment request mismatch"));
            }
            const tokenAmount = data.amount;
            console.log("[EVM.PaymentRequest] Token amount: ", tokenAmount.toString());
            if (tokenAmount.lt(minOut)) {
                console.error("[EVM.PaymentRequest] Not enough offered!");
                throw (new PaymentAuthError("Not enough offered!"));
            }
            return {
                intermediary: jsonBody.data.address,
                data,
                prefix: jsonBody.data.prefix,
                timeout: jsonBody.data.timeout,
                signature: jsonBody.data.signature
            };
        }
        if (jsonBody.code === 10003) {
            //Yet unpaid
            return null;
        }
        throw new PaymentAuthError(jsonBody.msg, jsonBody.code);
    }
    async waitForInvoiceStatus(bolt11PaymentReq, url, abortSignal, intervalSeconds) {
        if (abortSignal != null && abortSignal.aborted) {
            throw new Error("Aborted");
        }
        const decodedPR = bolt11.decode(bolt11PaymentReq);
        //const paymentHash = decodedPR.tagsObject.payment_hash;
        //const amount = ethers.BigNumber.from(decodedPR.millisatoshis).div(ethers.BigNumber.from(1000));
        while (!abortSignal.aborted) {
            const result = await this.getInvoiceStatus(bolt11PaymentReq, url, abortSignal);
            if (result != false)
                return result;
            await timeoutPromise(intervalSeconds || 5);
        }
        throw new Error("Aborted");
    }
    async waitForIncomingPaymentAuthorization(bolt11PaymentReq, minOut, url, address, abortSignal, intervalSeconds) {
        if (abortSignal != null && abortSignal.aborted) {
            throw new Error("Aborted");
        }
        const decodedPR = bolt11.decode(bolt11PaymentReq);
        //const paymentHash = decodedPR.tagsObject.payment_hash;
        //const amount = ethers.BigNumber.from(decodedPR.millisatoshis).div(ethers.BigNumber.from(1000));
        while (!abortSignal.aborted) {
            const result = await this.getPaymentAuthorization(bolt11PaymentReq, minOut, url, address, abortSignal);
            if (result != null)
                return result;
            await timeoutPromise(intervalSeconds || 5);
        }
        throw new Error("Aborted");
    }
    /*static waitForIncomingPayment(address: string, bolt11PaymentReq: string, minOut: ethers.BigNumber, abortSignal?: AbortSignal): Promise<{
        data: AtomicSwapStruct,
        intermediary: string
    }> {
        if(abortSignal!=null && abortSignal.aborted) {
            return Promise.reject("Aborted");
        }

        const decodedPR = bolt11.decode(bolt11PaymentReq);

        const paymentHash = decodedPR.tagsObject.payment_hash;
        const amount = ethers.BigNumber.from(decodedPR.millisatoshis).div(ethers.BigNumber.from(1000));

        return new Promise((resolve, reject) => {
            if(abortSignal!=null && abortSignal.aborted) {
                reject(new Error("Aborted"));
                return;
            }

            const filter = this.contract.filters.PaymentRequest(null, address, "0x"+paymentHash);

            this.contract.on(filter, async (offerer, claimer, commitment, data, event) => {
                //Transfers to me
                const tokenAddress = data.token;

                if (tokenAddress.toLowerCase() !== wbtcContractData.address.toLowerCase()) {
                    console.error("[EVM.PaymentRequest] Invalid token used");
                    this.contract.removeAllListeners(filter);
                    reject(new Error("Invalid token used"));
                    return;
                }

                const tokenAmount = data.amount;

                const expiryTimestamp = data.expiry;
                const currentTimestamp = Math.floor(Date.now() / 1000);

                console.log("[EVM.PaymentRequest] Expiry time: ", expiryTimestamp.toString());

                if (expiryTimestamp.sub(ethers.BigNumber.from(currentTimestamp)).lt(ethers.BigNumber.from(MIN_TIME_TO_CONFIRM))) {
                    console.error("[EVM.PaymentRequest] Not enough time to reliably pay the invoice");
                    this.contract.removeAllListeners(filter);
                    reject(new Error("Not enough time to reliably pay the invoice"));
                    return;
                }

                const paymentHashInTx = data.paymentHash.substring(2).toLowerCase();

                console.log("[EVM.PaymentRequest] lightning payment hash: ", paymentHashInTx);

                if(paymentHashInTx!==paymentHash.toLowerCase()) {
                    console.error("[EVM.PaymentRequest] lightning payment request mismatch");
                    this.contract.removeAllListeners(filter);
                    reject(new Error("Lightning payment request mismatch"));
                    return;
                }

                console.log("[EVM.PaymentRequest] Invoice amount: ", amount.toString());
                console.log("[EVM.PaymentRequest] Token amount: ", tokenAmount.toString());

                if (tokenAmount.lt(minOut)) {
                    console.error("[EVM.PaymentRequest] Not enough offered!");
                    this.contract.removeAllListeners(filter);
                    reject(new Error("Not enough offered!"));
                    return;
                }

                resolve({
                    data: this.structToAtomicSwap(data),
                    intermediary: offerer
                });
            });

            if(abortSignal!=null) abortSignal.addEventListener("abort", () => {
                this.contract.removeAllListeners(filter);
                reject(new Error("Aborted"));
            });
        });
    }*/
    static isValidAuthorization(intermediary, data, timeout, prefix, signature) {
        const expiryTimestamp = ethers.BigNumber.from(timeout);
        const currentTimestamp = ethers.BigNumber.from(Math.floor(Date.now() / 1000));
        const isExpired = expiryTimestamp.sub(currentTimestamp).lt(ethers.BigNumber.from(ConstantBTCLNtoEVM.authorizationGracePeriod));
        if (isExpired) {
            throw new Error("Authorization expired!");
        }
        const swapWillExpireTooSoon = data.expiry.sub(currentTimestamp).lt(ethers.BigNumber.from(ConstantBTCLNtoEVM.authorizationGracePeriod).add(ethers.BigNumber.from(ConstantBTCLNtoEVM.claimGracePeriod)));
        if (swapWillExpireTooSoon) {
            throw new Error("Swap will expire too soon!");
        }
        const atomicSwapStruct = BTCLNtoEVM.atomicSwapToStruct(data);
        const encodedCommitmentData = ethers.utils.defaultAbiCoder.encode([
            "address",
            "tuple(address,address,uint256,bytes32,uint64)"
        ], [
            intermediary,
            atomicSwapStruct
        ]);
        const commitment = ethers.utils.solidityKeccak256([
            "bytes"
        ], [
            encodedCommitmentData
        ]);
        console.log("prefix: ", "0x" + Buffer.from(prefix).toString("hex"));
        const encoded = ethers.utils.solidityPack([
            "bytes",
            "bytes32",
            "uint64"
        ], [
            "0x" + Buffer.from(prefix).toString("hex"),
            commitment,
            ethers.BigNumber.from(timeout)
        ]);
        const digestHash = ethers.utils.solidityKeccak256([
            "bytes"
        ], [
            encoded
        ]);
        console.log("Message hash: ", digestHash);
        const recoveredAddress = ethers.utils.verifyMessage(Buffer.from(digestHash.substring(2), "hex"), signature);
        console.log("Recovered address: ", recoveredAddress);
        const invalidSignature = recoveredAddress.toLowerCase() !== intermediary.toLowerCase();
        if (invalidSignature) {
            throw new Error("Invalid signature!");
        }
    }
    createPayTxWithAuthorization(intermediary, data, timeout, prefix, signature) {
        BTCLNtoEVM.isValidAuthorization(intermediary, data, timeout, prefix, signature);
        const sigObj = ethers.utils.splitSignature(signature);
        return this.contract.populateTransaction["offerer_payInvoice(address,(address,address,uint256,bytes32,uint64),uint64,(bytes32,bytes32,uint8))"](intermediary, BTCLNtoEVM.atomicSwapToStruct(data), ethers.BigNumber.from(timeout), [
            sigObj.r,
            sigObj.s,
            sigObj.v
        ]);
    }
    createClaimTx(intermediary, data, secret) {
        const expiryTimestamp = data.expiry;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        console.log("[EVM.PaymentRequest] Expiry time: ", expiryTimestamp.toString());
        if (expiryTimestamp.sub(ethers.BigNumber.from(currentTimestamp)).lt(ethers.BigNumber.from(MIN_TIME_TO_CONFIRM))) {
            console.error("[EVM.PaymentRequest] Not enough time to reliably pay the invoice");
            throw new Error("Not enough time to reliably pay the invoice");
        }
        return this.contract.populateTransaction["claimer_claim(address,(address,address,uint256,bytes32,uint64),bytes32)"](intermediary, data, "0x" + secret.toString("hex"));
    }
    createRejectTx(intermediary, data) {
        const expiryTimestamp = data.expiry;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        console.log("[EVM.PaymentRequest] Expiry time: ", expiryTimestamp.toString());
        if (expiryTimestamp.sub(ethers.BigNumber.from(currentTimestamp)).lt(ethers.BigNumber.from(MIN_TIME_TO_CONFIRM))) {
            console.error("[EVM.PaymentRequest] Not enough time to reliably reject the invoice");
            throw new Error("Not enough time to reliably reject the invoice");
        }
        return this.contract.populateTransaction["claimer_refundPayer(address,(address,address,uint256,bytes32,uint64))"](intermediary, data);
    }
}
export default BTCLNtoEVM;
