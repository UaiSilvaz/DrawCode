import React from "react";
import { Button, Slider } from "@mui/material";

export default (editor) => {
    const addMui = ({ type, component, props }) => {
        editor.Components.addType(type, {
            extend: "react-component",
            model: {
                defaults: {
                    component,
                    ...props
                }
            }
        });

        editor.BlockManager.add(type, {
            label: type,
            category: "MUI",
            content: { type }
        });
    };

    addMui({
        type: "MuiButton",
        component: Button,
        props: {
            attributes: {
                variant: "contained",
                color: "primary"
            },
            components: "Click me",
            traits: [
                {
                    type: "select",
                    label: "Variant",
                    name: "variant",
                    options: [
                        { value: "contained", name: "Contained" },
                        { value: "outlined", name: "Outlined" }
                    ]
                },
                {
                    type: "select",
                    label: "Color",
                    name: "color",
                    options: [
                        { value: "primary", name: "Primary" },
                        { value: "secondary", name: "Secondary" }
                    ]
                }
            ]
        }
    });

    addMui({
        type: "MuiSlider",
        component: Slider,
        props: {
            attributes: {
                min: 0,
                max: 100
            },
            traits: [
                { type: "number", label: "Min", name: "min" },
                { type: "number", label: "Max", name: "max" }
            ]
        }
    });
};
