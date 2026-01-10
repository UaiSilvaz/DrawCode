import Listing from "../react/Listing";

export default (editor) => {
    editor.Components.addType("Listing", {
        extend: "react-component",
        model: {
            defaults: {
                component: Listing,
                attributes: {
                    mlsid: "Default MLSID"
                },
                traits: [
                    { type: "number", label: "MLS ID", name: "mlsid" }
                ]
            }
        }
    });

    editor.BlockManager.add("listing", {
        label: "Listing",
        category: "React",
        content: "<Listing>Foo</Listing>"
    });
};
