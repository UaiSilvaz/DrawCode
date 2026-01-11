export default (editor) => {
    const bm = editor.BlockManager;

    bm.add("square", {
        label: "Quadrado",
        category: "Formas",
        content: '<div style="width:100px;height:100px;background:#6366f1;"></div>'
    });

    bm.add("circle", {
        label: "Círculo",
        category: "Formas",
        content: '<div style="width:100px;height:100px;border-radius:50%;background:#ec4899;"></div>'
    });

    bm.add("image", {
        label: "Imagem",
        category: "Mídia",
        content: { type: "image" }
    });
};
