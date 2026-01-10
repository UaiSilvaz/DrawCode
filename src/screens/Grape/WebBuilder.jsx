import { useEffect } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

import basicPlugin from "grapesjs-blocks-basic";
import formPlugin from "grapesjs-plugin-forms";
import webPlugin from "grapesjs-preset-webpage";
import grapejsRulers from "grapesjs-rulers";
import tabs from "grapesjs-tabs";
import flexbox from "grapesjs-blocks-flexbox";

export default function WebBuilder() {
    useEffect(() => {
        const editor = grapesjs.init({
            container: "#gjs",
            height: "100vh",
            width: "100%",
            fromElement: false,

            plugins: [
                basicPlugin,
                formPlugin,
                webPlugin,
                grapejsRulers,
                tabs,
                flexbox
            ],

            storageManager: false,

            selectorManager: {
                componentFirst: true
            }
        });

    }, []);

    return <div id="gjs" style={{ height: "100vh" }} />;
}
