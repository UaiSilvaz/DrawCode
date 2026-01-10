import ReactText from "../react/ReactText";

export default (editor) => {
    editor.Components.addType("ReactText", {
        extend: "react-component",
        model: {
            defaults: {
                component: ReactText,
                stylable: true,
                draggable: true,
                droppable: true,
                editable: true,
            }
        },
        isComponent: el => el.tagName === "REACTTEXT"
    });

    editor.BlockManager.add("react-text-block", {
        label: "React Text",
        category: "React",
        content: "<ReactText />"
    });
};
