import { useEffect, useState } from "react";

export default function Listing({ mlsid, children }) {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setCounter(c => c + 1), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <div>
            <div>Mlsid: {mlsid}</div>
            <div>{children}</div>
            <div>Counter: {counter}</div>
        </div>
    );
}
