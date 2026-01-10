import React from "react";
import ReactDOM from "react-dom/client";

export default (editor) => {
    const domc = editor.Components;
    const defType = domc.getType("default");
    const defModel = defType.model;

    domc.addType("react-component", {
        model: {
            toHTML(opts = {}) {
                return defModel.prototype.toHTML.call(this, {
                    ...opts,
                    tag: this.get("type")
                });
            }
        },
        view: {
            tagName: "div",

            createReactEl(cmp, props) {
                return React.createElement(cmp, props);
            },

            render() {
                const { model, el } = this;
                const reactEl = this.createReactEl(
                    model.get("component"),
                    model.get("attributes")
                );
                ReactDOM.createRoot(el).render(reactEl);
                return this;
            }
        }
    });
};
