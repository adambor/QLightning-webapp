import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ethers } from 'ethers';
import { useState } from "react";
import { Alert, Button, Card } from "react-bootstrap";
import { FEConstants } from "../Constants";
async function switchMetamaskToChain(chain) {
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const chainId = "0x" + chain.chainId.toString(16);
    //@ts-ignore
    const res = await provider.send('eth_chainId');
    if (res === chainId) {
        return true;
    }
    try {
        // @ts-ignore
        await provider.send('wallet_switchEthereumChain', [{ chainId }]);
        return true;
    }
    catch (e) {
        if (e.code === 4902) {
            try {
                // @ts-ignore
                await provider.send('wallet_addEthereumChain', [chain]);
                return true;
            }
            catch (addError) {
                console.error(addError);
            }
        }
        //Metamask not installed, probably
    }
    return false;
}
function WalletTab(props) {
    const [message, setMessage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const accountChangedHandler = async (newAccount) => {
        const address = await newAccount.getAddress();
        setDefaultAccount(address);
        props.callback(newAccount);
    };
    const connectwalletHandler = async () => {
        try {
            // @ts-ignore
            if (window.ethereum) {
                setProcessing(true);
                setMessage("Switch metamask to " + FEConstants.ethereum.chainName);
                const success = await switchMetamaskToChain(FEConstants.ethereum);
                if (!success) {
                    setMessage("You need to switch metamask to " + FEConstants.ethereum.chainName + " please retry!");
                    setProcessing(false);
                    return;
                }
                // @ts-ignore
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setMessage(null);
                await provider.send("eth_requestAccounts", []);
                await accountChangedHandler(provider.getSigner());
                setProcessing(false);
            }
            else {
                setErrorMessage("Please Install Metamask!!!");
            }
        }
        catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };
    return (_jsx(Card, Object.assign({ bg: "light" }, { children: _jsxs(Card.Body, { children: [message != null ? (_jsx(Alert, Object.assign({ variant: "warning" }, { children: message }))) : "", _jsx(Button, Object.assign({ onClick: connectwalletHandler, variant: defaultAccount ? "success" : "primary", disabled: processing || defaultAccount != null }, { children: defaultAccount ? "Connected" : "Connect" }))] }) })));
}
export default WalletTab;
