import QrScanner from 'qr-scanner';
import * as React from "react";
import {useEffect, useRef} from "react";


export function QRScanner(props: {
    onResult: (data, err) => void,
    camera: "user" | "environment"
}) {

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const qrScanner = new QrScanner(
            videoRef.current,
            result => props.onResult(result, null),
            {
                preferredCamera: props.camera,
                highlightScanRegion: true,
                highlightCodeOutline: false,
                returnDetailedScanResult: true
            },
        );
        qrScanner.start();

        return () => {
            qrScanner.stop();
        }
    }, []);

    return (
        <video ref={videoRef} style={{
            width: "100%"
        }}>

        </video>
    );
}