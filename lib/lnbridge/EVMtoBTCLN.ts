import {ethers} from "ethers";
import * as bolt11 from "bolt11";

import evmtobtclnContract from "./contracts/evmtobtclnContract";
import wbtcContractData from "./contracts/wbtcContract";
import {ConstantEVMtoBTCLN} from "../../src/Constants";
import fetch, {Response} from "cross-fetch";
import {Buffer} from "buffer";
import {AtomicSwapStruct} from "./BTCLNtoEVM";

const timeoutPromise = (timeoutSeconds) => {
    return new Promise(resolve => {
        setTimeout(resolve, timeoutSeconds*1000)
    });
};

export type PaymentRequestStruct = {
    intermediary: string,
    token: string,
    amount: ethers.BigNumber,
    paymentHash: string,
    expiry: ethers.BigNumber
};

export const PaymentRequestStatus = {
    EXPIRED: 0,
    NOT_FOUND: 1,
    PAYING: 2,
    PAID: 3,
    REFUNDABLE: 4
};

class EVMtoBTCLN {

    static paymentRequestToStruct(data: PaymentRequestStruct) {
        return [
            data.intermediary,
            data.token,
            data.amount,
            data.paymentHash,
            data.expiry
        ];
    }

    provider: ethers.providers.Provider;
    contract: ethers.Contract;
    wbtcContract: ethers.Contract;

    constructor(provider: ethers.providers.Provider) {
        this.provider = provider;
        this.contract = new ethers.Contract(evmtobtclnContract.address, evmtobtclnContract.abi, provider);
        this.wbtcContract = new ethers.Contract(wbtcContractData.address, wbtcContractData.abi, provider);
    }

    getBalance(address: string): Promise<ethers.BigNumber> {
        return this.wbtcContract.balanceOf(address);
    }

    getAllowance(address: string): Promise<ethers.BigNumber> {
        return this.wbtcContract.allowance(address, evmtobtclnContract.address);
    }

    static getCommitmentFor(address: string, data: PaymentRequestStruct) {
        const encoded = ethers.utils.defaultAbiCoder.encode([
            "address",
            "tuple(address,address,uint256,bytes32,uint64)"
        ], [
            address,
            this.paymentRequestToStruct(data)
        ]);

        return ethers.utils.solidityKeccak256(["bytes"], [encoded]);
    }

    static isExpired(data: PaymentRequestStruct) {
        const currentTimestamp = ethers.BigNumber.from(Math.floor(Date.now()/1000)-ConstantEVMtoBTCLN.refundGracePeriod);

        const isExpired = data.expiry.lt(currentTimestamp);

        return isExpired;
    }

    private static isValidAuthorization(address: string, data: PaymentRequestStruct, timeout: string, prefix: string, signature: string) {

        const expiryTimestamp = ethers.BigNumber.from(timeout);
        const currentTimestamp = ethers.BigNumber.from(Math.floor(Date.now() / 1000));

        const isExpired = expiryTimestamp.sub(currentTimestamp).lt(ethers.BigNumber.from(ConstantEVMtoBTCLN.authorizationGracePeriod));

        if (isExpired) {
            throw new Error("Authorization expired!");
        }

        const commitment = EVMtoBTCLN.getCommitmentFor(address, data);

        console.log("Commitment: ", commitment);

        console.log("prefix: ", prefix);
        console.log("prefix: ", "0x"+Buffer.from(prefix).toString("hex"));

        const encoded = ethers.utils.solidityPack([
            "bytes",
            "bytes32",
            "uint64"
        ], [
            "0x"+Buffer.from(prefix).toString("hex"),
            commitment,
            expiryTimestamp
        ]);

        console.log("Encoded: ", encoded);

        const digestHash = ethers.utils.solidityKeccak256([
            "bytes"
        ], [
            encoded
        ]);

        console.log("Message hash: ", digestHash);

        const recoveredAddress = ethers.utils.verifyMessage(Buffer.from(digestHash.substring(2),"hex"), signature);

        console.log("Recovered address: ", recoveredAddress);

        const invalidSignature = recoveredAddress.toLowerCase()!==data.intermediary.toLowerCase();
        if(invalidSignature) {
            throw new Error("Invalid signature!");
        }

    }

    async getCommitStatus(address: string, data: PaymentRequestStruct): Promise<number> {

        //Check if is commited
        const commitment = await this.contract.getCommitment(data.paymentHash);

        console.log("Commitment: ", commitment);

        if(ethers.BigNumber.from(commitment).eq(ethers.BigNumber.from(1))) return PaymentRequestStatus.PAID;

        const hash = EVMtoBTCLN.getCommitmentFor(address, data);

        const isCorrectCommitment = commitment.toLowerCase()===hash.toLowerCase();

        if(!isCorrectCommitment) {
            if(EVMtoBTCLN.isExpired(data)) {
                return PaymentRequestStatus.EXPIRED;
            }

            return PaymentRequestStatus.NOT_FOUND;
        }

        if(EVMtoBTCLN.isExpired(data)) {
            return PaymentRequestStatus.REFUNDABLE;
        }
        return PaymentRequestStatus.PAYING;
    }

    async getPaymentHashStatus(paymentHash: string): Promise<number> {
        //Check if is commited
        const commitment = await this.contract.getCommitment(paymentHash);

        if(ethers.BigNumber.from(commitment).eq(ethers.BigNumber.from(1))) return PaymentRequestStatus.PAID;
        if(ethers.BigNumber.from(commitment).eq(ethers.BigNumber.from(0))) return PaymentRequestStatus.NOT_FOUND;
        return PaymentRequestStatus.PAYING;
    }

    async isRequestRefundable(address: string, data: PaymentRequestStruct) {

        const currentTimestamp = ethers.BigNumber.from(Math.floor(Date.now()/1000)-ConstantEVMtoBTCLN.refundGracePeriod);

        const isExpired = data.expiry.lt(currentTimestamp);

        if(!isExpired) return false;

        //Check if is commited
        const commitment = await this.contract.getCommitment(data.paymentHash);

        const hash = EVMtoBTCLN.getCommitmentFor(address, data);

        const isCorrectCommitment = commitment.toLowerCase()===hash.toLowerCase();

        return isCorrectCommitment;

    }

    createApproveTx(amount: ethers.BigNumber): Promise<ethers.UnsignedTransaction> {
        return this.wbtcContract.populateTransaction.approve(evmtobtclnContract.address, amount);
    }

    async payBOLT11PaymentRequest(bolt11PayReq: string, expirySeconds: number, maxFee: ethers.BigNumber, url: string): Promise<{
        confidence: string,
        address: string,
        data: PaymentRequestStruct
    }> {

        const parsedPR = bolt11.decode(bolt11PayReq);

        if(parsedPR.satoshis==null) {
            throw new Error("Must be an invoice with amount");
        }

        const payStatus = await this.getPaymentHashStatus("0x"+parsedPR.tagsObject.payment_hash);

        if(payStatus!==PaymentRequestStatus.NOT_FOUND) {
            throw new Error("Invoice already being paid for or paid");
        }

        const sats = ethers.BigNumber.from(parsedPR.satoshis);

        const expiryTimestamp = (Math.floor(Date.now()/1000)+expirySeconds).toString();

        const response: Response = await fetch(url+"/payInvoice", {
            method: "POST",
            body: JSON.stringify({
                pr: bolt11PayReq,
                maxFee: maxFee.toString(),
                expiryTimestamp
            }),
            headers: {'Content-Type': 'application/json'}
        });

        if(response.status!==200) {
            let resp: string;
            try {
                resp = await response.text();
            } catch (e) {
                throw new Error(response.statusText);
            }
            throw new Error(resp);
        }

        let jsonBody: any = await response.json();

        return {
            confidence: jsonBody.data.confidence,
            address: jsonBody.data.address,
            data: {
                intermediary: jsonBody.data.address,
                token: this.wbtcContract.address,
                amount: sats.add(maxFee),
                paymentHash: "0x"+parsedPR.tagsObject.payment_hash,
                expiry: ethers.BigNumber.from(expiryTimestamp)
            }
        }

    }

    async createPayTx(address: string, data: PaymentRequestStruct): Promise<ethers.UnsignedTransaction> {
        const obj = EVMtoBTCLN.paymentRequestToStruct(data);

        console.log("[EVM.offerer_payInvoice] struct created: ", obj);

        const payStatus = await this.getPaymentHashStatus(data.paymentHash);

        if(payStatus!==PaymentRequestStatus.NOT_FOUND) {
            throw new Error("Invoice already being paid for or paid");
        }

        const tx = await this.contract.populateTransaction["offerer_payInvoice((address,address,uint256,bytes32,uint64),bool)"](obj, true);

        return tx;
    }

    async getRefundAuthorization(address: string, data: PaymentRequestStruct, url: string): Promise<{
        is_paid: boolean,
        prefix?: string,
        timeout?: string,
        signature?: string
    }> {

        const response: Response = await fetch(url+"/getRefundAuthorization", {
            method: "POST",
            body: JSON.stringify({
                paymentHash: data.paymentHash.substring(2)
            }),
            headers: {'Content-Type': 'application/json'}
        });

        if(response.status!==200) {
            let resp: string;
            try {
                resp = await response.text();
            } catch (e) {
                throw new Error(response.statusText);
            }
            throw new Error(resp);
        }

        let jsonBody: any = await response.json();

        if(jsonBody.code===20007) {
            //Not found
            return null;
        }

        if(jsonBody.code===20008) {
            //In-flight
            return null;
        }

        if(jsonBody.code===20006) {
            //Already paid
            return {
                is_paid: true
            };
        }

        if(jsonBody.code===20000) {
            //Success
            EVMtoBTCLN.isValidAuthorization(address, data, jsonBody.data.timeout, jsonBody.data.prefix, jsonBody.data.signature);

            return {
                is_paid: false,
                prefix: jsonBody.data.prefix,
                timeout: jsonBody.data.timeout,
                signature: jsonBody.data.signature
            }
        }


    }

    async waitForRefundAuthorization(address: string, data: PaymentRequestStruct, url: string, abortSignal?: AbortSignal, intervalSeconds?: number): Promise<{
        is_paid: boolean,
        prefix?: string,
        timeout?: string,
        signature?: string
    }> {
        if(abortSignal!=null && abortSignal.aborted) {
            throw new Error("Aborted");
        }

        //const paymentHash = decodedPR.tagsObject.payment_hash;
        //const amount = ethers.BigNumber.from(decodedPR.millisatoshis).div(ethers.BigNumber.from(1000));

        while(abortSignal!=null && !abortSignal.aborted) {
            const result = await this.getRefundAuthorization(address, data, url);
            if(result!=null) return result;
            await timeoutPromise(intervalSeconds || 5);
        }

        throw new Error("Aborted");
    }

    async createMultiRefundTx(address: string, datas: PaymentRequestStruct[], noCheck?: boolean) {

        if(!noCheck) {
            for(let data of datas) {
                if(!(await this.isRequestRefundable(address, data))) {
                    throw new Error("Not refundable yet!");
                }
            }
        }

        return await this.contract.populateTransaction["offerer_refund(address,(address,address,uint256,bytes32,uint64)[])"](address, datas.map(e => EVMtoBTCLN.paymentRequestToStruct(e)));

    }

    async createRefundTx(address: string, data: PaymentRequestStruct, noCheck?: boolean): Promise<ethers.UnsignedTransaction> {

        if(!noCheck) {
            if(!(await this.isRequestRefundable(address, data))) {
                throw new Error("Not refundable yet!");
            }
        }

        return await this.contract.populateTransaction["offerer_refund(address,(address,address,uint256,bytes32,uint64))"](address, EVMtoBTCLN.paymentRequestToStruct(data));

    }

    async createRefundTxWithAuthorization(address: string, data: PaymentRequestStruct, timeout: string, prefix: string, signature: string, noCheck?: boolean): Promise<ethers.UnsignedTransaction> {

        if(!noCheck) {
            const commitment = await this.contract.getCommitment(data.paymentHash);
            if(commitment!=EVMtoBTCLN.getCommitmentFor(address, data)) {
                throw new Error("Not correctly committed");
            }
        }

        EVMtoBTCLN.isValidAuthorization(address, data, timeout, prefix, signature);

        const sigObj = ethers.utils.splitSignature(signature);

        return this.contract.populateTransaction["claimer_refundPayer(address,(address,address,uint256,bytes32,uint64),uint64,(bytes32,bytes32,uint8),bool)"](
            address,
            EVMtoBTCLN.paymentRequestToStruct(data),
            ethers.BigNumber.from(timeout),
            [
                sigObj.r,
                sigObj.s,
                sigObj.v
            ],
            true
        );

    }

    async waitForRequestResult(address: string, data: PaymentRequestStruct, abortSignal?: AbortSignal): Promise<boolean> {

        return new Promise((resolve,reject) => {
            if(abortSignal!=null && abortSignal.aborted) {
                reject(new Error("Aborted"));
                return;
            }

            const claimedFilter = this.contract.filters.Claimed(address, data.intermediary, data.paymentHash);
            const refundFilter = this.contract.filters.Refunded(address, data.intermediary, data.paymentHash);

            this.contract.on(claimedFilter, async (offerer, claimer, paymentHash, secret, event) => {
                console.log("[EVM.offerer_payInvoice] Invoice settled, id: ", paymentHash.substring(2));
                this.contract.removeAllListeners(claimedFilter);
                this.contract.removeAllListeners(refundFilter);
                resolve(true);
            });

            this.contract.on(refundFilter, async (offerer, claimer, paymentHash, event) => {
                console.log("[EVM.offerer_payInvoice] Invoice refunded, id: ", paymentHash.substring(2));
                this.contract.removeAllListeners(claimedFilter);
                this.contract.removeAllListeners(refundFilter);
                resolve(false);
            });

            if(abortSignal!=null) abortSignal.addEventListener("abort", () => {
                this.contract.removeAllListeners(claimedFilter);
                this.contract.removeAllListeners(refundFilter);
                reject(new Error("Aborted"));
            });
        });

    }

    //TODO: Not implemented yet because of a 10k max block range limitation on QuickNode RPCs
    async getPastConversions(address: string, startBlockHeight?: number): Promise<PaymentRequestStruct[]> {
        throw new Error("Not implemented");
        // const structs: PaymentRequestStruct[] = [];
        // return structs;
    }

}

export default EVMtoBTCLN;