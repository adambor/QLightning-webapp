import { ethers } from 'ethers';
import {useState} from "react";
import {Alert, Button, Card} from "react-bootstrap";
import * as React from "react";
import {FEConstants} from "../Constants";
import {bool} from "prop-types";



async function switchMetamaskToChain(chain: any): Promise<boolean> {
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const chainId = "0x"+chain.chainId.toString(16);

    //@ts-ignore
    const res = await provider.send( 'eth_chainId');

    if(res===chainId) {
        return true;
    }

    try {
        // @ts-ignore
        await provider.send('wallet_switchEthereumChain', [{ chainId }]);
        return true;
    } catch (e: any) {
        if (e.code === 4902) {
            try {
                // @ts-ignore
                await provider.send('wallet_addEthereumChain', [chain]);
                return true;
            } catch (addError) {
                console.error(addError);
            }
        }
        //Metamask not installed, probably

    }
    return false;
}

function WalletTab(props: {
    callback: (signer: ethers.Signer) => void
}) {
    const [message, setMessage] = useState<string>(null);
    const [processing, setProcessing] = useState<boolean>(false);

    const [errorMessage, setErrorMessage] = useState<string>(null);
    const [defaultAccount, setDefaultAccount] = useState<string>(null);

    const accountChangedHandler = async (newAccount: ethers.Signer) => {
        const address = await newAccount.getAddress();
        setDefaultAccount(address);
        props.callback(newAccount);
    };
    const connectwalletHandler = async () => {
        try {
            // @ts-ignore
            if (window.ethereum) {
                setProcessing(true);
                setMessage("Switch metamask to "+FEConstants.ethereum.chainName);
                const success = await switchMetamaskToChain(FEConstants.ethereum);
                if(!success) {
                    setMessage("You need to switch metamask to "+FEConstants.ethereum.chainName+" please retry!");
                    setProcessing(false);
                    return;
                }

                // @ts-ignore
                const provider = new ethers.providers.Web3Provider(window.ethereum);

                setMessage(null);
                await provider.send("eth_requestAccounts", []);
                await accountChangedHandler(provider.getSigner());

                setProcessing(false);
            } else {
                setErrorMessage("Please Install Metamask!!!");
            }
        } catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };

    return (
        <Card bg="light">
            <Card.Body>
                {message!=null ? (<Alert variant="warning">
                    {message}
                </Alert>) : ""}
                <Button onClick={connectwalletHandler} variant={defaultAccount ? "success" : "primary"} disabled={processing || defaultAccount!=null}>
                    {defaultAccount ? "Connected" : "Connect"}
                </Button>
            </Card.Body>
        </Card>
    )

}

export default WalletTab;