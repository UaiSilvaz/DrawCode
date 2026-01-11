export default function setupShapes(editor) {
    const bm = editor.BlockManager;

    bm.add('circle', {
        label: 'Círculo',
        category: 'Shapes',
        content: '<div style="width:120px;height:120px;border-radius:50%;background:#6c4cff"></div>'
    });

    bm.add('square', {
        label: 'Quadrado',
        category: 'Shapes',
        content: '<div style="width:120px;height:120px;background:#ff5cf7"></div>'
    });

    bm.add('triangle', {
        label: 'Triângulo',
        category: 'Shapes',
        content: '<div style="width:0;height:0;border-left:60px solid transparent;border-right:60px solid transparent;border-bottom:120px solid #6c4cff"></div>'
    });
}
