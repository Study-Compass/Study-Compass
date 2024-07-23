class Classroom {
    constructor(outlets, windows, classtype, printer, tabletype, building, id) {
        this.outlets = outlets;
        this.windows = windows;
        this.classtype = classtype;
        this.printer = printer;
        this.tabletype = tabletype;
        this.building = building;
        this.id = id;
    }

    display() {
        console.log(`Outlets: ${this.outlets}`);
        console.log(`Windows: ${this.windows}`);
        console.log(`Class Type: ${this.classtype}`);
        console.log(`Printer: ${this.printer}`);
        console.log(`Table Type: ${this.tabletype}`);
        console.log(`Building: ${this.building}`);
        console.log(`ID: ${this.id}`);
    }
}

function sortPred(left, right) {
    return left[0] > right[0];
}

function sortPredPair(left, right) {
    return left[0] > right[0];
}

function imp(free, order, preferences, building, previous, variety) {
    let best = new Classroom(
        preferences[0] === "true",
        preferences[1] === "true",
        preferences[2],
        preferences[3] === "true",
        preferences[4],
        building,
        0
    );

    let outletWeight = 0;
    let windowWeight = 0;
    let classWeight = 0;
    let printerWeight = 0;
    let tableWeight = 0;
    let buildingWeight = 1;
    let sorted = [];
    let sortedWithoutRandom = [];

    for (let i = 0; i < 5; i++) {
        let x = order[i];
        if (x === "outlets") outletWeight = i + 1;
        else if (x === "windows") windowWeight = i + 1;
        else if (x === "classType") classWeight = i + 1;
        else if (x === "printer") printerWeight = i + 1;
        else if (x === "tableType") tableWeight = i + 1;
    }

    let numYesOutlet = 0;
    let numYesWindow = 0;
    let numYesPrinter = 0;
    let numLab = 0;
    let numLec = 0;
    let numBig = 0;
    let numSmall = 0;
    for (let j = 0; j < 10; j++) {
        if (previous[j].outlets) numYesOutlet++;
        if (previous[j].windows) numYesWindow++;
        if (previous[j].printer) numYesPrinter++;
        if (previous[j].tabletype === "SmallDesk") numSmall++;
        if (previous[j].tabletype === "BigDesk") numBig++;
        if (previous[j].classtype === "Lab") numLab++;
        if (previous[j].classtype === "Lecture") numLec++;
    }

    if (numYesOutlet >= 7) {
        if (best.outlets) outletWeight += 1;
        else outletWeight /= 1.5;
    } else if (numYesOutlet <= 3) {
        if (!best.outlets) outletWeight += 1;
        else outletWeight /= 1.5;
    }

    if (numYesWindow >= 7) {
        if (best.windows) windowWeight += 1;
        else windowWeight /= 1.5;
    } else if (numYesWindow <= 3) {
        if (!best.windows) windowWeight += 1;
        else windowWeight /= 1.5;
    }

    if (numYesPrinter >= 7) {
        if (best.printer) printerWeight += 1;
        else printerWeight /= 1.5;
    } else if (numYesPrinter <= 3) {
        if (!best.printer) printerWeight += 1;
        else printerWeight /= 1.5;
    }

    if (numLab >= 7) {
        if (best.classtype === "Lab") classWeight += 1;
        else classWeight /= 1.5;
    } else if (numLec >= 7) {
        if (best.classtype === "Lecture") classWeight += 1;
        else classWeight /= 1.5;
    } else if (numLab + numLec <= 3) {
        if (best.classtype === "Classroom") classWeight += 1;
        else classWeight /= 1.5;
    }

    if (numBig >= 7) {
        if (best.tabletype === "BigDesk") tableWeight += 1;
        else tableWeight /= 1.5;
    } else if (numSmall >= 7) {
        if (best.tabletype === "SmallDesk") tableWeight += 1;
        else tableWeight /= 1.5;
    } else if (numSmall + numBig <= 3) {
        if (best.tabletype === "Table") tableWeight += 1;
        else tableWeight /= 1.5;
    }

    for (let i = 0; i < free.length; i++) {
        let temp = free[i];
        let weight = 0;
        if (temp.outlets === best.outlets) weight += outletWeight / 2;
        if (temp.windows === best.windows) weight += windowWeight / 2;
        if (temp.classtype === best.classtype) weight += classWeight / 2;
        if (temp.printer === best.printer) weight += printerWeight / 2;
        if (temp.tabletype === best.tabletype) weight += tableWeight / 2;
        if (temp.building === best.building) weight += buildingWeight / 2;
        for (let j = 0; j < 10; j++) {
            if (previous[j] === temp) weight += 1 - variety / 4;
        }
        sortedWithoutRandom.push([weight, temp]);
    }

    sortedWithoutRandom.sort(sortPred);

    for (let j = 0; j < sortedWithoutRandom.length; j++) {
        let weight = sortedWithoutRandom[j][0];
        if (variety !== 0) weight += Math.random() * Math.pow(1.8, variety);
        sorted.push([weight, [j + 1, sortedWithoutRandom[j][1]]]);
    }

    sorted.sort(sortPredPair);
    return sorted;
}

let preferences = ["true", "false", "Lecture", "true", "SmallDesk"];
let order = ["windows", "outlets", "tableType", "classType", "printer"];

let room1 = new Classroom(true, false, "Lecture", false, "SmallDesk", "Building B", 101);
let room2 = new Classroom(true, true, "Lecture", false, "LargeDesk", "Building A", 102);
let room3 = new Classroom(false, true, "Lab", true, "Table", "Building C", 103);
let room4 = new Classroom(true, false, "Lecture", true, "SmallDesk", "Building C", 104);
let room5 = new Classroom(false, false, "Classroom", true, "LargeDesk", "Building B", 105);
let room6 = new Classroom(true, true, "Classroom", false, "SmallDesk", "Building A", 106);

let free = [room1, room2, room3, room4, room5, room6];
let previous = [room1, room1, room2, room1, room5, room4, room3, room6, room2, room1];

let done = imp(free, order, preferences, "Building B", previous, 4);
done.forEach((item) => {
    console.log(`\nClassroom ${item[1][1].id}:`);
    item[1][1].display();
    console.log(`Weight: ${item[0]}`);
    console.log(`Original Position: ${item[1][0]}`);
});
