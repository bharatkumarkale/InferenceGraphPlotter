function downloadSVG() {
    const svg = document.querySelector('svg');

    // CSS must be explicitly embedded
    const style = createStyleElementFromCSS();
    svg.insertBefore(style, svg.firstChild);

    const data = (new XMLSerializer()).serializeToString(svg);
    const svgBlob = new Blob([data], {
        type: 'image/svg+xml;charset=utf-8'
    });

    // remove the temporarily injected CSS
    // style.remove();

    // convert the blob object to a dedicated URL
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.download = 'image.svg';
    document.body.appendChild(a);
    a.href = url;
    a.click();
    a.remove();

}

const createStyleElementFromCSS = () => {
    const styleRules = [];
    try {
        for (let sheetIndex = 0; sheetIndex < document.styleSheets.length; sheetIndex++) {
            const sheet = document.styleSheets[sheetIndex];
            for (let i = 0; i < sheet.cssRules.length; i++)
                styleRules.push(sheet.cssRules.item(i).cssText); 
        }
    }
    catch(err) {    
    }
    
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(styleRules.join(' ')))
    return style;
  };