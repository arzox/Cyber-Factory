import Tile from "./tile";

function appendInputTiles(inputTiles: Array<Tile>, newInputTiles: Array<Tile>) {
    for (const tile of newInputTiles) {
        inputTiles.push(tile);
    }
}

function moveItemsInArray(contentArray: Array<unknown | undefined>): void{
    for (let i = 1; i < contentArray.size(); i++) {
        if (contentArray[i - 1] === undefined) {
            contentArray[i - 1] = contentArray[i];
            contentArray[i] = undefined;
        }
    }
}

function transferContent(previousArray: Array<unknown | undefined>, nextArray: Array<unknown | undefined>, nextArraySize: number): Array<unknown | undefined> {
    for (let i = 0; i < previousArray.size(); i++) {
        const lastElementIndex = nextArraySize - 1 - i;
        if (previousArray[i] !== undefined && nextArray[lastElementIndex] === undefined) {
            nextArray[lastElementIndex] = previousArray[i];
            previousArray[i] = undefined;
        }
    }
    return previousArray;
}

function copyArray(from: Array<unknown>, to: Array<unknown>): Array<unknown> {
    for (let i = 0; i < from.size(); i++) {
        to[i] = from[i];
    }
    return to;
}
    

function copySegment(array: Array<unknown | undefined>, start: number, finish: number): Array<unknown | undefined> {
    let segment = new Array<unknown | undefined>(finish - start, undefined);
    for (let i = start; i < finish; i++) {
        segment[i] = array[i];
    }

    return segment;
}

/**
 * take [start...end] from array
 * @returns the array removed
 */
function removeSegment(array: Array<unknown | undefined>, start: number, finish: number): Array<unknown | undefined> {
    let removedSegment = new Array<unknown | undefined>(finish - start + 1, undefined);
    for (let i = finish; i >= start; i--) {
        removedSegment[i] = array[i];
        array[i] = undefined;
    }

    return removedSegment;
}

function addSegment(array: Array<unknown | undefined>, segment: Array<unknown | undefined>, start: number): void {
    for (let i = start; i < segment.size(); i++) {
        array[i] = segment[i];
    }
}

export { appendInputTiles, moveItemsInArray, transferContent, copySegment, removeSegment, addSegment, copyArray };