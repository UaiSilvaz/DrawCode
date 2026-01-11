'use client';

import { useEffect } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

import "./ui.css";
import Dock from "@/components/Dock";

import {
    VscHome,
    VscArchive,
    VscAccount,
    VscSettingsGear
} from "react-icons/vsc";

import blocksElements from "./blocks-elements";
import blocksLayouts from "./blocks-layouts";

export default function WebBuilder() {

    useEffect(() => {
        const editor = grapesjs.init({
            container: "#gjs",
            height: "100%",
            width: "100%",
            fromElement: false,
            storageManager: false,
            selectorManager: { componentFirst: true },
            panels: { defaults: [] },
            blockManager: { appendTo: "#blocks" },
            styleManager: { appendTo: "#styles" },
            layerManager: { appendTo: "#layers" },
            traitManager: { appendTo: "#traits" }
        });

        blocksElements(editor);
        blocksLayouts(editor);
    }, []);

    // 🔹 AQUI FICA O DOCK
    const items = [
        { icon: <VscHome size={18} />, label: 'Home', onClick: () => alert('Home!') },
        { icon: <VscArchive size={18} />, label: 'Archive', onClick: () => alert('Archive!') },
        { icon: <VscAccount size={18} />, label: 'Profile', onClick: () => alert('Profile!') },
        { icon: <VscSettingsGear size={18} />, label: 'Settings', onClick: () => alert('Settings!') },
    ];

    return (
        <div className="draw-layout">

            <aside className="draw-sidebar" id="blocks" />

            <main className="draw-canvas-wrapper">

                <div className="draw-canvas-wrapper">
                    <div id="gjs" className="draw-canvas" />
                </div>

                <Dock
                    items={items}
                    panelHeight={68}
                    baseItemSize={50}
                    magnification={70}
                />

            </main>


            <aside className="draw-right">
                <div id="styles"></div>
                <div id="traits"></div>
                <div id="layers"></div>
            </aside>

        </div>
    );
}
