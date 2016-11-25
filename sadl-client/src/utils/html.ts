export function removeContent(element: HTMLElement) {
    let firstChild = element.firstChild;
    while (firstChild) {
        element.removeChild(firstChild);
        firstChild = element.firstChild;
    }
}