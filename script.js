
/* =========================================================
   DIGITAL LOGIC GATE SIMULATOR
   Boolean Expression -> Automatic Gate Circuit
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let nodes = [];

let connections = [];

let nodeCounter = 0;

let selectedNode = null;

let selectedWire = null;

let draggingNode = null;

let connectionStart = null;

let zoom = 1;

let history = [];

let historyIndex = -1;

let historyLock = false;

let challenge = null;


/* =========================================================
   ELEMENT REFERENCES
   ========================================================= */

const workspace =
    document.getElementById("workspace");

const canvas =
    document.getElementById("canvas");

const nodesLayer =
    document.getElementById("nodes");

const wires =
    document.getElementById("wires");

const statusElement =
    document.getElementById("status");


/* =========================================================
   LOGIC FUNCTIONS
   ========================================================= */

const logic = {

    AND: (a, b) =>
        a && b,

    OR: (a, b) =>
        a || b,

    NOT: a =>
        !a,

    NAND: (a, b) =>
        !(a && b),

    NOR: (a, b) =>
        !(a || b),

    XOR: (a, b) =>
        a !== b,

    XNOR: (a, b) =>
        a === b

};


/* =========================================================
   UTILITY
   ========================================================= */

function status(message) {

    if (statusElement) {

        statusElement.textContent =
            message;

    }

}


function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function getNode(id) {

    return nodes.find(
        node =>
            node.id === id
    );

}


function countInputs(type) {

    return type === "NOT"
        ? 1
        : 2;

}


/* =========================================================
   HISTORY
   ========================================================= */

function snapshot() {

    return JSON.stringify({

        nodes,
        connections,
        nodeCounter

    });

}


function pushHistory() {

    if (historyLock) {

        return;

    }

    history =
        history.slice(
            0,
            historyIndex + 1
        );

    history.push(
        snapshot()
    );

    historyIndex =
        history.length - 1;

}


function restoreSnapshot(data) {

    const parsed =
        JSON.parse(data);

    nodes =
        parsed.nodes || [];

    connections =
        parsed.connections || [];

    nodeCounter =
        parsed.nodeCounter || 0;

    selectedNode =
        null;

    selectedWire =
        null;

    renderAll();

    calculate();

}


function undo() {

    if (
        historyIndex <= 0
    ) {

        status(
            "Nothing to undo"
        );

        return;

    }

    historyIndex--;

    historyLock = true;

    restoreSnapshot(
        history[historyIndex]
    );

    historyLock = false;

    status(
        "Undo"
    );

}


function redo() {

    if (
        historyIndex >=
        history.length - 1
    ) {

        status(
            "Nothing to redo"
        );

        return;

    }

    historyIndex++;

    historyLock = true;

    restoreSnapshot(
        history[historyIndex]
    );

    historyLock = false;

    status(
        "Redo"
    );

}


/* =========================================================
   CREATE INPUT
   ========================================================= */

function createInput(
    x,
    y,
    label
) {

    const node = {

        id:
            "node_" +
            (++nodeCounter),

        type:
            "INPUT",

        x:
            x,

        y:
            y,

        label:
            label ||
            "INPUT" +
            nodeCounter,

        value:
            false,

        outputValue:
            false

    };

    nodes.push(node);

    return node;

}


/* =========================================================
   CREATE OUTPUT
   ========================================================= */

function createOutput(
    x,
    y,
    label
) {

    const node = {

        id:
            "node_" +
            (++nodeCounter),

        type:
            "OUTPUT",

        x:
            x,

        y:
            y,

        label:
            label ||
            "OUTPUT" +
            nodeCounter,

        value:
            false,

        outputValue:
            false

    };

    nodes.push(node);

    return node;

}


/* =========================================================
   CREATE GATE
   ========================================================= */

function createGate(
    type,
    x,
    y
) {

    const node = {

        id:
            "node_" +
            (++nodeCounter),

        type:
            type,

        x:
            x,

        y:
            y,

        label:
            type,

        value:
            false,

        outputValue:
            false

    };

    nodes.push(node);

    return node;

}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

    nodesLayer.innerHTML = "";

    nodes.forEach(
        node =>
            renderNode(node)
    );

    drawWires();

}


/* =========================================================
   RENDER NODE
   ========================================================= */

function renderNode(node) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "node";

    element.id =
        node.id;

    element.style.left =
        node.x + "px";

    element.style.top =
        node.y + "px";


    if (
        selectedNode ===
        node.id
    ) {

        element.classList.add(
            "selected"
        );

    }


    const header =
        document.createElement(
            "div"
        );

    header.className =
        "node-header";

    header.textContent =
        node.label ||
        node.type;

    header.addEventListener(
        "mousedown",
        startDrag
    );


    const body =
        document.createElement(
            "div"
        );

    body.className =
        "gate-body";


    if (
        node.type === "INPUT"
    ) {

        body.innerHTML = `

            <button
                class="input-switch">

                ${
                    node.value
                        ? "1"
                        : "0"
                }

            </button>

        `;

        body
            .querySelector(
                ".input-switch"
            )
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    node.value =
                        !node.value;

                    calculate();

                    renderAll();

                    pushHistory();

                }
            );

    }

    else if (
        node.type === "OUTPUT"
    ) {

        body.innerHTML = `

            <strong>
                Y =
                ${
                    node.outputValue
                        ? 1
                        : 0
                }
            </strong>

        `;

    }

    else {

        body.textContent =
            node.type;

    }


    element.appendChild(
        header
    );

    element.appendChild(
        body
    );


    /* INPUT PORTS */

    if (
        node.type !==
        "INPUT"
    ) {

        const numberInputs =
            countInputs(
                node.type
            );

        for (
            let i = 0;
            i < numberInputs;
            i++
        ) {

            const port =
                document.createElement(
                    "div"
                );

            port.className =
                "port input-port";

            port.dataset.node =
                node.id;

            port.dataset.port =
                "input" + i;

            port.style.top =
                (
                    48 +
                    (
                        (i + 1) *
                        (
                            50 /
                            (numberInputs + 1)
                        )
                    )
                ) +
                "px";

            port.style.left =
                "-9px";

            port.addEventListener(
                "mousedown",
                event => {

                    event.stopPropagation();

                    if (
                        connectionStart
                    ) {

                        finishConnection(
                            event
                        );

                    }

                }
            );

            element.appendChild(
                port
            );

        }

    }


    /* OUTPUT PORT */

    if (
        node.type !==
        "OUTPUT"
    ) {

        const port =
            document.createElement(
                "div"
            );

        port.className =
            "port output-port";

        port.dataset.node =
            node.id;

        port.dataset.port =
            "output";

        port.style.right =
            "-9px";

        port.style.top =
            "50%";

        port.style.transform =
            "translateY(-50%)";

        port.addEventListener(
            "mousedown",
            startConnection
        );

        element.appendChild(
            port
        );

    }


    element.addEventListener(
        "click",
        event => {

            if (
                event.target.classList
                    .contains("port")
            ) {

                return;

            }

            selectNode(
                node.id
            );

        }
    );


    nodesLayer.appendChild(
        element
    );

}


/* =========================================================
   SELECT NODE
   ========================================================= */

function selectNode(id) {

    selectedNode =
        id;

    selectedWire =
        null;

    document
        .querySelectorAll(
            ".node"
        )
        .forEach(
            element => {

                element.classList.toggle(

                    "selected",

                    element.id === id

                );

            }
        );


    drawWires();

    const node =
        getNode(id);

    status(

        "Selected: " +

        (
            node?.label ||
            node?.type
        )

    );

}


/* =========================================================
   SELECT WIRE
   ========================================================= */

function selectWire(index) {

    selectedWire =
        index;

    selectedNode =
        null;

    document
        .querySelectorAll(
            ".node"
        )
        .forEach(
            element =>
                element.classList.remove(
                    "selected"
                )
        );

    drawWires();

    status(
        "Wire selected - press Delete"
    );

}


/* =========================================================
   DRAG NODE
   ========================================================= */

function startDrag(event) {

    event.preventDefault();

    const element =
        event.currentTarget
            .closest(".node");

    const node =
        getNode(
            element.id
        );

    selectNode(
        node.id
    );


    const rect =
        element.getBoundingClientRect();


    draggingNode = {

        node,

        offsetX:
            event.clientX -
            rect.left,

        offsetY:
            event.clientY -
            rect.top

    };


    document.addEventListener(
        "mousemove",
        dragMove
    );

    document.addEventListener(
        "mouseup",
        stopDrag
    );

}


function dragMove(event) {

    if (
        !draggingNode
    ) {

        return;

    }


    const rect =
        workspace.getBoundingClientRect();


    const node =
        draggingNode.node;


    node.x = Math.max(

        5,

        (
            event.clientX -
            rect.left -
            draggingNode.offsetX
        ) / zoom

    );


    node.y = Math.max(

        5,

        (
            event.clientY -
            rect.top -
            draggingNode.offsetY
        ) / zoom

    );


    const element =
        document.getElementById(
            node.id
        );


    element.style.left =
        node.x + "px";

    element.style.top =
        node.y + "px";


    drawWires();

}


function stopDrag() {

    if (
        draggingNode
    ) {

        pushHistory();

    }

    draggingNode =
        null;

    document.removeEventListener(
        "mousemove",
        dragMove
    );

    document.removeEventListener(
        "mouseup",
        stopDrag
    );

}


/* =========================================================
   CONNECTING
   ========================================================= */

function startConnection(event) {

    event.preventDefault();

    event.stopPropagation();


    const port =
        event.currentTarget;


    if (
        port.dataset.port !==
        "output"
    ) {

        status(
            "Start from an output ●"
        );

        return;

    }


    connectionStart = {

        nodeId:
            port.dataset.node

    };


    document.addEventListener(
        "mouseup",
        finishConnection
    );


    status(
        "Release on an input ●"
    );

}


function finishConnection(event) {

    document.removeEventListener(
        "mouseup",
        finishConnection
    );


    if (
        !connectionStart
    ) {

        return;

    }


    let element =
        document.elementFromPoint(

            event.clientX,
            event.clientY

        );


    element =
        element?.closest(
            ".port"
        );


    if (
        element &&
        element.dataset.port
            .startsWith("input")
    ) {

        const from =
            connectionStart.nodeId;

        const to =
            element.dataset.node;

        const port =
            element.dataset.port;


        if (
            from !== to
        ) {

            connections =
                connections.filter(

                    connection =>

                        !(
                            connection.to ===
                            to &&

                            connection.port ===
                            port
                        )

                );


            connections.push({

                from:
                    from,

                to:
                    to,

                port:
                    port

            });


            calculate();

            renderAll();

            pushHistory();

            status(
                "Connected"
            );

        }

    }


    connectionStart =
        null;

}


/* =========================================================
   DRAW WIRES
   ========================================================= */

function drawWires() {

    wires.innerHTML = "";

    connections.forEach(
        (
            connection,
            index
        ) => {

            const from =
                getNode(
                    connection.from
                );

            const to =
                getNode(
                    connection.to
                );


            if (
                !from ||
                !to
            ) {

                return;

            }


            const p1 =
                getPortPosition(
                    from,
                    "output"
                );

            const p2 =
                getPortPosition(
                    to,
                    connection.port
                );


            const path =
                document.createElementNS(

                    "http://www.w3.org/2000/svg",

                    "path"

                );


            const dx =
                Math.max(
                    50,
                    Math.abs(
                        p2.x - p1.x
                    ) * 0.5
                );


            const d =

                `M ${p1.x} ${p1.y}
                 C ${p1.x + dx} ${p1.y},
                   ${p2.x - dx} ${p2.y},
                   ${p2.x} ${p2.y}`;


            path.setAttribute(
                "d",
                d
            );

            path.setAttribute(
                "fill",
                "none"
            );

            path.setAttribute(
                "stroke",
                selectedWire === index
                    ? "#f59e0b"
                    : "#2563eb"
            );

            path.setAttribute(
                "stroke-width",
                selectedWire === index
                    ? "5"
                    : "3"
            );

            path.setAttribute(
                "stroke-linecap",
                "round"
            );

            path.style.cursor =
                "pointer";


            path.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    selectWire(
                        index
                    );

                }
            );


            wires.appendChild(
                path
            );

        }
    );

}


/* =========================================================
   GET PORT POSITION
   ========================================================= */

function getPortPosition(
    node,
    port
) {

    const element =
        document.getElementById(
            node.id
        );


    if (
        !element
    ) {

        return {

            x:
                node.x,

            y:
                node.y

        };

    }


    const rect =
        element.getBoundingClientRect();


    const workspaceRect =
        workspace.getBoundingClientRect();


    if (
        port ===
        "output"
    ) {

        return {

            x:
                (
                    node.x +
                    150
                ),

            y:
                (
                    node.y +
                    52
                )

        };

    }


    const index =
        Number(
            port.replace(
                "input",
                ""
            )
        );


    const numberInputs =
        countInputs(
            node.type
        );


    return {

        x:
            node.x,

        y:
            node.y +
            48 +
            (
                (index + 1) *
                (
                    50 /
                    (
                        numberInputs +
                        1
                    )
                )
            )

    };

}


/* =========================================================
   NODE VISUAL
   ========================================================= */

function nodeValue(
    node
) {

    if (
        node.type ===
        "INPUT"
    ) {

        return !!node.value;

    }


    if (
        node.type ===
        "OUTPUT"
    ) {

        return !!node.outputValue;

    }


    return !!node.outputValue;

}


/* =========================================================
   EVALUATE NODE
   ========================================================= */

function evaluate(
    nodeId,
    visited = new Set()
) {

    const node =
        getNode(nodeId);


    if (
        !node
    ) {

        return false;

    }


    if (
        visited.has(nodeId)
    ) {

        return false;

    }


    visited.add(
        nodeId
    );


    if (
        node.type ===
        "INPUT"
    ) {

        node.outputValue =
            !!node.value;

        return node.outputValue;

    }


    if (
        node.type ===
        "OUTPUT"
    ) {

        const input =
            connections.find(

                connection =>

                    connection.to ===
                    node.id

            );


        if (
            !input
        ) {

            node.outputValue =
                false;

            return false;

        }


        node.outputValue =
            evaluate(
                input.from,
                new Set(visited)
            );


        return node.outputValue;

    }


    const inputCount =
        countInputs(
            node.type
        );


    const values = [];


    for (
        let i = 0;
        i < inputCount;
        i++
    ) {

        const connection =
            connections.find(

                item =>

                    item.to ===
                    node.id &&

                    item.port ===
                    "input" + i

            );


        values.push(

            connection

                ? evaluate(
                    connection.from,
                    new Set(visited)
                )

                : false

        );

    }


    if (
        node.type ===
        "NOT"
    ) {

        node.outputValue =
            logic.NOT(
                values[0]
            );

    }

    else {

        node.outputValue =
            logic[node.type](
                values[0],
                values[1]
            );

    }


    return node.outputValue;

}


/* =========================================================
   CALCULATE
   ========================================================= */

function calculate() {

    nodes.forEach(
        node => {

            node.outputValue =
                false;

        }
    );


    nodes
        .filter(
            node =>
                node.type ===
                "OUTPUT"
        )
        .forEach(
            output =>
                evaluate(
                    output.id
                )
        );


    renderOutputs();

    drawWires();

}


/* =========================================================
   RENDER OUTPUT VALUES
   ========================================================= */

function renderOutputs() {

    nodes
        .filter(
            node =>
                node.type ===
                "OUTPUT"
        )
        .forEach(
            node => {

                const element =
                    document.getElementById(
                        node.id
                    );


                if (
                    !element
                ) {

                    return;

                }


                const body =
                    element.querySelector(
                        ".gate-body"
                    );


                if (
                    body
                ) {

                    body.innerHTML = `

                        <strong>
                            Y =
                            ${
                                node.outputValue
                                    ? 1
                                    : 0
                            }
                        </strong>

                    `;

                }

            }
        );

}


/* =========================================================
   ZOOM
   ========================================================= */

function setZoom(
    value
) {

    zoom =
        Math.max(
            0.5,
            Math.min(
                2,
                value
            )
        );


    canvas.style.transform =
        `scale(${zoom})`;


    const zoomValue =
        document.getElementById(
            "zoomValue"
        );


    if (
        zoomValue
    ) {

        zoomValue.textContent =
            Math.round(
                zoom * 100
            ) + "%";

    }


    drawWires();

}


/* =========================================================
   DELETE SELECTED
   ========================================================= */

function deleteSelected() {

    if (
        selectedWire !== null
    ) {

        connections.splice(
            selectedWire,
            1
        );

        selectedWire =
            null;

        renderAll();

        calculate();

        pushHistory();

        status(
            "Wire deleted"
        );

        return;

    }


    if (
        selectedNode
    ) {

        const id =
            selectedNode;


        nodes =
            nodes.filter(
                node =>
                    node.id !== id
            );


        connections =
            connections.filter(

                connection =>

                    connection.from !== id &&

                    connection.to !== id

            );


        selectedNode =
            null;


        renderAll();

        calculate();

        pushHistory();

        status(
            "Node deleted"
        );

        return;

    }


    status(
        "Select a node or wire first"
    );

}


/* =========================================================
   CLEAR CIRCUIT
   ========================================================= */

function clearCircuit() {

    if (
        !confirm(
            "Clear the complete circuit?"
        )
    ) {

        return;

    }


    nodes = [];

    connections = [];

    selectedNode =
        null;

    selectedWire =
        null;

    nodeCounter =
        0;


    renderAll();

    calculate();

    pushHistory();

    status(
        "Circuit cleared"
    );

}


/* =========================================================
   RESET INPUTS
   ========================================================= */

function resetInputs() {

    nodes
        .filter(
            node =>
                node.type ===
                "INPUT"
        )
        .forEach(
            node => {

                node.value =
                    false;

            }
        );


    calculate();

    renderAll();

    pushHistory();

    status(
        "Inputs reset"
    );

}


/* =========================================================
   RENAME SELECTED
   ========================================================= */

function renameSelected() {

    if (
        !selectedNode
    ) {

        status(
            "Select a node first"
        );

        return;

    }


    const node =
        getNode(
            selectedNode
        );


    if (
        !node
    ) {

        return;

    }


    const name =
        prompt(
            "Enter new name:",
            node.label
        );


    if (
        name &&
        name.trim()
    ) {

        node.label =
            name.trim();

        renderAll();

        pushHistory();

        status(
            "Node renamed"
        );

    }

}


/* =========================================================
   SAVE CIRCUIT
   ========================================================= */

function saveCircuit() {

    const data =
        snapshot();


    const blob =
        new Blob(

            [data],

            {
                type:
                    "application/json"
            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href =
        url;

    a.download =
        "digital_logic_circuit.json";


    a.click();


    URL.revokeObjectURL(
        url
    );


    status(
        "Circuit saved"
    );

}


/* =========================================================
   LOAD CIRCUIT
   ========================================================= */

function loadCircuit(
    file
) {

    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                restoreSnapshot(
                    event.target.result
                );

                pushHistory();

                status(
                    "Circuit loaded"
                );

            }

            catch (
                error
            ) {

                status(
                    "Invalid circuit file"
                );

            }

        };


    reader.readAsText(
        file
    );

}


/* =========================================================
   VALIDATE CIRCUIT
   ========================================================= */

function validateCircuit() {

    const validationBox =
        document.getElementById(
            "validationBox"
        );


    const inputs =
        nodes.filter(
            node =>
                node.type ===
                "INPUT"
        );


    const outputs =
        nodes.filter(
            node =>
                node.type ===
                "OUTPUT"
        );


    const gates =
        nodes.filter(
            node =>
                logic[node.type]
        );


    let errors = [];


    if (
        inputs.length === 0
    ) {

        errors.push(
            "No INPUT node found."
        );

    }


    if (
        outputs.length === 0
    ) {

        errors.push(
            "No OUTPUT node found."
        );

    }


    gates.forEach(
        gate => {

            const required =
                countInputs(
                    gate.type
                );


            for (
                let i = 0;
                i < required;
                i++
            ) {

                const connected =
                    connections.some(

                        connection =>

                            connection.to ===
                            gate.id &&

                            connection.port ===
                            "input" + i

                    );


                if (
                    !connected
                ) {

                    errors.push(

                        `${gate.label ||
                        gate.type}
                        input ${i + 1}
                        is not connected.`

                    );

                }

            }

        }
    );


    outputs.forEach(
        output => {

            const connected =
                connections.some(

                    connection =>

                        connection.to ===
                        output.id

                );


            if (
                !connected
            ) {

                errors.push(

                    `${output.label ||
                    "OUTPUT"}
                    is not connected.`

                );

            }

        }
    );


    if (
        errors.length === 0
    ) {

        validationBox.innerHTML = `

            <span class="success">
                ✓ Circuit is valid.
            </span>

        `;

        status(
            "Circuit valid"
        );

    }

    else {

        validationBox.innerHTML = `

            <span class="error">
                ✗ Circuit has problems:
            </span>

            <ul>

                ${
                    errors
                        .map(
                            error =>
                                `<li>
                                    ${error}
                                </li>`
                        )
                        .join("")
                }

            </ul>

        `;

        status(
            "Circuit has errors"
        );

    }

}


/* =========================================================
   BUILD NODE EXPRESSION
   ========================================================= */

function buildNodeExpression(
    nodeId,
    visited = new Set()
) {

    const node =
        getNode(nodeId);


    if (
        !node
    ) {

        return "0";

    }


    if (
        visited.has(nodeId)
    ) {

        return "?";

    }


    const newVisited =
        new Set(
            visited
        );


    newVisited.add(
        nodeId
    );


    if (
        node.type ===
        "INPUT"
    ) {

        return node.label ||
            "A";

    }


    const required =
        countInputs(
            node.type
        );


    const inputs = [];


    for (
        let i = 0;
        i < required;
        i++
    ) {

        const connection =
            connections.find(

                item =>

                    item.to ===
                    node.id &&

                    item.port ===
                    "input" + i

            );


        if (
            connection
        ) {

            inputs.push(

                buildNodeExpression(

                    connection.from,

                    newVisited

                )

            );

        }

        else {

            inputs.push(
                "0"
            );

        }

    }


    if (
        node.type ===
        "NOT"
    ) {

        return (

            "(" +
            inputs[0] +
            ")'"

        );

    }


    if (
        node.type ===
        "AND"
    ) {

        return (

            "(" +
            inputs[0] +
            "." +
            inputs[1] +
            ")"

        );

    }


    if (
        node.type ===
        "OR"
    ) {

        return (

            "(" +
            inputs[0] +
            "+" +
            inputs[1] +
            ")"

        );

    }


    if (
        node.type ===
        "NAND"
    ) {

        return (

            "NAND(" +
            inputs[0] +
            "," +
            inputs[1] +
            ")"

        );

    }


    if (
        node.type ===
        "NOR"
    ) {

        return (

            "NOR(" +
            inputs[0] +
            "," +
            inputs[1] +
            ")"

        );

    }


    if (
        node.type ===
        "XOR"
    ) {

        return (

            "XOR(" +
            inputs[0] +
            "," +
            inputs[1] +
            ")"

        );

    }


    if (
        node.type ===
        "XNOR"
    ) {

        return (

            "XNOR(" +
            inputs[0] +
            "," +
            inputs[1] +
            ")"

        );

    }


    return node.type;

}


/* =========================================================
   UPDATE EXPRESSION
   ========================================================= */

function updateExpression() {

    const outputs =
        nodes.filter(
            node =>
                node.type ===
                "OUTPUT"
        );


    const expressionBox =
        document.getElementById(
            "expressionBox"
        );


    if (
        outputs.length === 0
    ) {

        expressionBox.innerHTML = `

            <span class="error">
                No output found.
            </span>

        `;

        return;

    }


    const expressions =
        outputs.map(
            output =>

                (
                    output.label ||
                    "Y"
                ) +
                " = " +
                buildNodeExpression(
                    output.id
                )

        );


    expressionBox.innerHTML =

        expressions
            .map(
                expression =>
                    `<div>
                        ${escapeHTML(
                            expression
                        )}
                    </div>`
            )
            .join("");


    status(
        "Expression generated"
    );

}


/* =========================================================
   GATE TRUTH TABLE
   ========================================================= */

function showGateTruthTable() {

    let node =
        selectedNode
            ? getNode(
                selectedNode
            )
            : null;


    if (
        !node ||
        !logic[node.type]
    ) {

        node =
            nodes.find(
                item =>
                    logic[item.type]
            );

    }


    if (
        !node
    ) {

        status(
            "Select a logic gate first"
        );

        return;

    }


    const head =
        document.querySelector(
            "#truthTable thead tr"
        );


    const body =
        document.getElementById(
            "truthTableBody"
        );


    const inputCount =
        countInputs(
            node.type
        );


    head.innerHTML = "";


    for (
        let i = 0;
        i < inputCount;
        i++
    ) {

        head.innerHTML +=

            `<th>
                ${String.fromCharCode(
                    65 + i
                )}
            </th>`;

    }


    head.innerHTML +=
        "<th>Y</th>";


    body.innerHTML =
        "";


    const rows =
        Math.pow(
            2,
            inputCount
        );


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const values = [];


        for (
            let i = 0;
            i < inputCount;
            i++
        ) {

            values.push(

                Boolean(

                    (
                        row >>
                        (
                            inputCount -
                            i -
                            1
                        )
                    ) & 1

                )

            );

        }


        const result =

            inputCount === 1

                ? logic[node.type](
                    values[0]
                )

                : logic[node.type](
                    values[0],
                    values[1]
                );


        let html =
            "<tr>";


        values.forEach(
            value => {

                html +=

                    `<td>
                        ${
                            value
                                ? 1
                                : 0
                        }
                    </td>`;

            }
        );


        html +=

            `<td>
                ${
                    result
                        ? 1
                        : 0
                }
            </td>`;


        html +=
            "</tr>";


        body.innerHTML +=
            html;

    }


    document
        .getElementById(
            "truthTitle"
        )
        .textContent =

        node.type +
        " Truth Table";


    document
        .querySelector(
            ".truth-section"
        )
        .scrollIntoView({
            behavior:
                "smooth"
        });

}


/* =========================================================
   CIRCUIT TRUTH TABLE
   ========================================================= */

function showCircuitTruthTable() {

    const inputs =
        nodes.filter(
            node =>
                node.type ===
                "INPUT"
        );


    const outputs =
        nodes.filter(
            node =>
                node.type ===
                "OUTPUT"
        );


    if (
        !inputs.length ||
        !outputs.length
    ) {

        status(
            "Need INPUT and OUTPUT"
        );

        return;

    }


    if (
        inputs.length > 8
    ) {

        status(
            "Maximum 8 inputs supported"
        );

        return;

    }


    const head =
        document.querySelector(
            "#truthTable thead tr"
        );


    const body =
        document.getElementById(
            "truthTableBody"
        );


    head.innerHTML =
        "";


    inputs.forEach(
        (
            node,
            index
        ) => {

            head.innerHTML +=

                `<th>
                    ${
                        node.label ||
                        "A" +
                        (index + 1)
                    }
                </th>`;

        }
    );


    outputs.forEach(
        node => {

            head.innerHTML +=

                `<th>
                    ${
                        node.label ||
                        "Y"
                    }
                </th>`;

        }
    );


    body.innerHTML =
        "";


    const oldValues =
        inputs.map(
            node =>
                node.value
        );


    const rowCount =
        Math.pow(
            2,
            inputs.length
        );


    for (
        let row = 0;
        row < rowCount;
        row++
    ) {

        inputs.forEach(
            (
                node,
                index
            ) => {

                node.value =

                    Boolean(

                        (
                            row >>
                            (
                                inputs.length -
                                index -
                                1
                            )
                        ) & 1

                    );

            }
        );


        outputs.forEach(
            output =>

                evaluate(
                    output.id
                )

        );


        let html =
            "<tr>";


        inputs.forEach(
            node => {

                html +=

                    `<td>
                        ${
                            node.value
                                ? 1
                                : 0
                        }
                    </td>`;

            }
        );


        outputs.forEach(
            output => {

                html +=

                    `<td>
                        ${
                            output.outputValue
                                ? 1
                                : 0
                        }
                    </td>`;

            }
        );


        html +=
            "</tr>";


        body.innerHTML +=
            html;

    }


    inputs.forEach(
        (
            node,
            index
        ) => {

            node.value =
                oldValues[index];

        }
    );


    calculate();


    document
        .getElementById(
            "truthTitle"
        )
        .textContent =
        "Complete Circuit Truth Table";


    document
        .querySelector(
            ".truth-section"
        )
        .scrollIntoView({
            behavior:
                "smooth"
        });

}


/* =========================================================
   BOOLEAN EXPRESSION PARSER
   ========================================================= */


/*
    Supported operators:

    +       OR
    .       AND
    *       AND
    '       NOT
    !       NOT
    AND     AND
    OR      OR
    NOT     NOT
    NAND    NAND
    NOR     NOR
    XOR     XOR
    XNOR    XNOR
*/


function tokenize(expression) {

    let exp =
        expression
            .trim()
            .toUpperCase();


    exp =
        exp.replace(
            /\s+/g,
            ""
        );


    const tokens = [];


    let i = 0;


    while (
        i < exp.length
    ) {

        const char =
            exp[i];


        if (
            /[A-Z0-9]/.test(
                char
            )
        ) {

            let word =
                char;

            i++;


            while (
                i < exp.length &&
                /[A-Z0-9]/.test(
                    exp[i]
                )
            ) {

                word +=
                    exp[i];

                i++;

            }


            if (
                [
                    "AND",
                    "OR",
                    "NOT",
                    "NAND",
                    "NOR",
                    "XOR",
                    "XNOR"
                ].includes(
                    word
                )
            ) {

                tokens.push(
                    word
                );

            }

            else {

                for (
                    const letter of word
                ) {

                    tokens.push(
                        letter
                    );

                }

            }

            continue;

        }


        if (
            char === "1" ||
            char === "0"
        ) {

            tokens.push(
                char
            );

            i++;

            continue;

        }


        if (
            "+.*'!()".includes(
                char
            )
        ) {

            tokens.push(
                char
            );

            i++;

            continue;

        }


        throw new Error(

            "Invalid character: " +
            char

        );

    }


    /*
       Insert implicit AND.

       Example:

       AB
       A(B+C)
       (A+B)C
       A'B
    */

    const result = [];


    function isOperandEnd(
        token
    ) {

        return (

            /^[A-Z0-9]$/.test(
                token
            ) ||

            token === ")" ||

            token === "'"

        );

    }


    function isOperandStart(
        token
    ) {

        return (

            /^[A-Z0-9]$/.test(
                token
            ) ||

            token === "(" ||

            token === "NOT"

        );

    }


    for (
        let j = 0;
        j < tokens.length;
        j++
    ) {

        const current =
            tokens[j];


        const previous =
            result[
                result.length - 1
            ];


        if (
            previous &&
            isOperandEnd(
                previous
            ) &&
            isOperandStart(
                current
            )
        ) {

            result.push(
                "."
            );

        }


        result.push(
            current
        );

    }


    return result;

}


/* =========================================================
   OPERATOR PRECEDENCE
   ========================================================= */

function precedence(
    operator
) {

    const values = {

        "'": 5,

        "!": 5,

        "NOT": 5,

        "*": 4,

        ".": 4,

        "AND": 4,

        "NAND": 4,

        "NOR": 4,

        "XOR": 3,

        "XNOR": 3,

        "+": 2,

        "OR": 2

    };


    return (
        values[operator] ||
        0
    );

}


/* =========================================================
   OPERATOR CHECK
   ========================================================= */

function isOperator(
    token
) {

    return [

        "+",
        ".",
        "*",
        "'",
        "!",
        "AND",
        "OR",
        "NOT",
        "NAND",
        "NOR",
        "XOR",
        "XNOR"

    ].includes(
        token
    );

}


/* =========================================================
   POSTFIX
   ========================================================= */

function toPostfix(
    tokens
) {

    const output = [];

    const stack = [];


    for (
        const token of tokens
    ) {

        if (
            /^[A-Z0-9]$/.test(
                token
            )
        ) {

            output.push(
                token
            );

        }

        else if (
            token === "("
        ) {

            stack.push(
                token
            );

        }

        else if (
            token === ")"
        ) {

            while (

                stack.length &&
                stack[
                    stack.length - 1
                ] !== "("

            ) {

                output.push(
                    stack.pop()
                );

            }


            if (
                !stack.length
            ) {

                throw new Error(
                    "Mismatched parentheses."
                );

            }


            stack.pop();

        }

        else if (
            isOperator(
                token
            )
        ) {

            /*
               Postfix NOT should be
               immediately applied.
            */

            if (
                token === "'" ||
                token === "!" ||
                token === "NOT"
            ) {

                stack.push(
                    token
                );

            }

            else {

                while (

                    stack.length &&

                    stack[
                        stack.length - 1
                    ] !== "(" &&

                    precedence(
                        stack[
                            stack.length - 1
                        ]
                    ) >=
                    precedence(
                        token
                    )

                ) {

                    output.push(
                        stack.pop()
                    );

                }


                stack.push(
                    token
                );

            }

        }

        else {

            throw new Error(
                "Unknown token: " +
                token
            );

        }

    }


    while (
        stack.length
    ) {

        const operator =
            stack.pop();


        if (
            operator === "(" ||
            operator === ")"
        ) {

            throw new Error(
                "Mismatched parentheses."
            );

        }


        output.push(
            operator
        );

    }


    return output;

}


/* =========================================================
   BUILD BOOLEAN TREE
   ========================================================= */

function buildGateTree(
    postfix
) {

    const stack = [];


    for (
        const token of postfix
    ) {

        if (
            /^[A-Z]$/.test(
                token
            )
        ) {

            stack.push({

                kind:
                    "variable",

                name:
                    token

            });

        }

        else if (
            token === "0" ||
            token === "1"
        ) {

            stack.push({

                kind:
                    "constant",

                value:
                    token === "1"

            });

        }

        else if (

            token === "'" ||
            token === "!" ||
            token === "NOT"

        ) {

            if (
                stack.length < 1
            ) {

                throw new Error(
                    "Invalid NOT expression."
                );

            }


            const a =
                stack.pop();


            stack.push({

                type:
                    "NOT",

                inputs:
                    [a]

            });

        }

        else {

            if (
                stack.length < 2
            ) {

                throw new Error(
                    "Invalid Boolean expression."
                );

            }


            const b =
                stack.pop();

            const a =
                stack.pop();


            let type;


            switch (
                token
            ) {

                case ".":
                case "*":
                case "AND":

                    type =
                        "AND";

                    break;


                case "+":

                case "OR":

                    type =
                        "OR";

                    break;


                case "NAND":

                    type =
                        "NAND";

                    break;


                case "NOR":

                    type =
                        "NOR";

                    break;


                case "XOR":

                    type =
                        "XOR";

                    break;


                case "XNOR":

                    type =
                        "XNOR";

                    break;


                default:

                    throw new Error(
                        "Unknown operator: " +
                        token
                    );

            }


            stack.push({

                type:
                    type,

                inputs:
                    [
                        a,
                        b
                    ]

            });

        }

    }


    if (
        stack.length !== 1
    ) {

        throw new Error(
            "Invalid Boolean expression."
        );

    }


    return stack[0];

}


/* =========================================================
   COLLECT VARIABLES
   ========================================================= */

function collectVariables(
    tree,
    variables = new Set()
) {

    if (
        tree.kind ===
        "variable"
    ) {

        variables.add(
            tree.name
        );

        return variables;

    }


    if (
        tree.inputs
    ) {

        tree.inputs.forEach(
            child =>
                collectVariables(
                    child,
                    variables
                )
        );

    }


    return variables;

}


/* =========================================================
   CREATE CIRCUIT FROM TREE
   ========================================================= */

function buildCircuitFromExpression(
    tree
) {

    nodes = [];

    connections = [];

    nodeCounter = 0;

    selectedNode =
        null;

    selectedWire =
        null;


    const variables =
        [
            ...collectVariables(
                tree
            )
        ];


    const variableNodes = {};


    variables.forEach(
        (
            variable,
            index
        ) => {

            variableNodes[
                variable
            ] = createInput(

                50,

                80 +
                index * 130,

                variable

            );

        }
    );


    let gateIndex = 0;


    function build(
        current
    ) {

        if (
            current.kind ===
            "variable"
        ) {

            return variableNodes[
                current.name
            ];

        }


        if (
            current.kind ===
            "constant"
        ) {

            const input =
                createInput(

                    50,

                    80 +
                    (
                        variables.length +
                        gateIndex
                    ) * 130,

                    current.value
                        ? "1"
                        : "0"

                );


            input.value =
                current.value;


            return input;

        }


        const left =
            build(
                current.inputs[0]
            );


        let right = null;


        if (
            current.type !==
            "NOT"
        ) {

            right =
                build(
                    current.inputs[1]
                );

        }


        const y =
            100 +
            gateIndex * 150;


        const gate =
            createGate(

                current.type,

                400 +
                gateIndex * 180,

                y

            );


        gateIndex++;


        connections.push({

            from:
                left.id,

            to:
                gate.id,

            port:
                "input0"

        });


        if (
            right
        ) {

            connections.push({

                from:
                    right.id,

                to:
                    gate.id,

                port:
                    "input1"

            });

        }


        return gate;

    }


    const finalNode =
        build(
            tree
        );


    const output =
        createOutput(

            1000,

            250,

            "Y"

        );


    connections.push({

        from:
            finalNode.id,

        to:
            output.id,

        port:
            "input0"

    });


    renderAll();

    calculate();

    pushHistory();


    return {

        variables

    };

}


/* =========================================================
   TREE TO BOOLEAN EXPRESSION
   ========================================================= */

function treeToExpression(
    tree
) {

    if (
        tree.kind ===
        "variable"
    ) {

        return tree.name;

    }


    if (
        tree.kind ===
        "constant"
    ) {

        return tree.value
            ? "1"
            : "0";

    }


    if (
        tree.type ===
        "NOT"
    ) {

        return (

            "(" +
            treeToExpression(
                tree.inputs[0]
            ) +
            ")'"

        );

    }


    const operator = {

        AND:
            ".",

        OR:
            "+",

        NAND:
            " NAND ",

        NOR:
            " NOR ",

        XOR:
            " XOR ",

        XNOR:
            " XNOR "

    }[
        tree.type
    ];


    return (

        "(" +
        treeToExpression(
            tree.inputs[0]
        ) +
        operator +
        treeToExpression(
            tree.inputs[1]
        ) +
        ")"

    );

}


/* =========================================================
   BOOLEAN EXPRESSION TRUTH TABLE
   ========================================================= */

function generateExpressionTruthTable(
    tree
) {

    const variables =
        [
            ...collectVariables(
                tree
            )
        ];


    if (
        variables.length > 8
    ) {

        throw new Error(
            "Truth table is limited to 8 variables."
        );

    }


    const head =
        document.querySelector(
            "#truthTable thead tr"
        );


    const body =
        document.getElementById(
            "truthTableBody"
        );


    head.innerHTML =
        "";


    variables.forEach(
        variable => {

            head.innerHTML +=

                `<th>
                    ${variable}
                </th>`;

        }
    );


    head.innerHTML +=
        "<th>Y</th>";


    body.innerHTML =
        "";


    const rows =
        Math.pow(
            2,
            variables.length
        );


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const values = {};


        variables.forEach(
            (
                variable,
                index
            ) => {

                values[variable] =

                    Boolean(

                        (
                            row >>
                            (
                                variables.length -
                                index -
                                1
                            )
                        ) & 1

                    );

            }
        );


        const result =
            evaluateTree(
                tree,
                values
            );


        let html =
            "<tr>";


        variables.forEach(
            variable => {

                html +=

                    `<td>
                        ${
                            values[variable]
                                ? 1
                                : 0
                        }
                    </td>`;

            }
        );


        html +=

            `<td>
                ${
                    result
                        ? 1
                        : 0
                }
            </td>`;


        html +=
            "</tr>";


        body.innerHTML +=
            html;

    }


    document
        .getElementById(
            "truthTitle"
        )
        .textContent =
        "Boolean Expression Truth Table";

}


/* =========================================================
   EVALUATE TREE
   ========================================================= */

function evaluateTree(
    tree,
    values
) {

    if (
        tree.kind ===
        "variable"
    ) {

        return !!values[
            tree.name
        ];

    }


    if (
        tree.kind ===
        "constant"
    ) {

        return tree.value;

    }


    const inputA =
        evaluateTree(

            tree.inputs[0],

            values

        );


    if (
        tree.type ===
        "NOT"
    ) {

        return logic.NOT(
            inputA
        );

    }


    const inputB =
        evaluateTree(

            tree.inputs[1],

            values

        );


    return logic[
        tree.type
    ](

        inputA,
        inputB

    );

}


/* =========================================================
   SOLVE BOOLEAN EXPRESSION
   ========================================================= */

function solveBooleanExpression() {

    const input =
        document.getElementById(
            "booleanInput"
        );


    const expression =
        input.value.trim();


    const resultBox =
        document.getElementById(
            "solverResult"
        );


    if (
        !expression
    ) {

        resultBox.innerHTML =

            `<span class="error">
                Please enter a Boolean expression.
            </span>`;

        return;

    }


    try {

        const tokens =
            tokenize(
                expression
            );


        const postfix =
            toPostfix(
                tokens
            );


        const tree =
            buildGateTree(
                postfix
            );


        const result =
            buildCircuitFromExpression(
                tree
            );


        generateExpressionTruthTable(
            tree
        );


        const normalized =
            treeToExpression(
                tree
            );


        document
            .getElementById(
                "expressionBox"
            )
            .textContent =
            "Y = " +
            normalized;


        resultBox.innerHTML = `

            <span class="success">
                ✓ Expression solved successfully.
            </span>

            <br><br>

            <b>Original:</b>
            ${escapeHTML(expression)}

            <br>

            <b>Parsed:</b>
            ${escapeHTML(normalized)}

            <br>

            <b>Variables:</b>
            ${result.variables.join(", ")}

            <br><br>

            <span>
                The circuit has been generated
                automatically in the workspace.
            </span>

        `;


        document
            .querySelector(
                ".workspace-container"
            )
            .scrollIntoView({
                behavior:
                    "smooth"
            });


        status(
            "Boolean expression solved"
        );

    }

    catch (
        error
    ) {

        resultBox.innerHTML = `

            <span class="error">
                ✗ Could not solve expression.
            </span>

            <br><br>

            ${escapeHTML(
                error.message
            )}

        `;


        status(
            "Expression error"
        );

    }

}


/* =========================================================
   EXAMPLE BUTTON
   ========================================================= */

document
    .getElementById(
        "exampleBtn"
    )
    .onclick = () => {

        const examples = [

            "A+B",

            "A.B",

            "A'",

            "(A+B).C",

            "A.B+C.D",

            "A'B+BC'",

            "(A+B)(C+D)",

            "A XOR B",

            "A NAND B",

            "A NOR B",

            "A XNOR B",

            "((A+B').C+D).E'"

        ];


        const random =
            examples[
                Math.floor(
                    Math.random() *
                    examples.length
                )
            ];


        document
            .getElementById(
                "booleanInput"
            )
            .value =
            random;

    };


/* =========================================================
   ENTER TO SOLVE
   ========================================================= */

document
    .getElementById(
        "booleanInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                solveBooleanExpression();

            }

        }
    );


/* =========================================================
   SOLVE BUTTON
   ========================================================= */

document
    .getElementById(
        "solveBtn"
    )
    .onclick =
    solveBooleanExpression;


/* =========================================================
   DRAG GATES FROM PALETTE
   ========================================================= */

document
    .querySelectorAll(
        ".palette-gate"
    )
    .forEach(
        gate => {

            gate.addEventListener(
                "dragstart",
                event => {

                    event.dataTransfer.setData(

                        "gate",

                        gate.dataset.gate

                    );

                }
            );

        }
    );


/* =========================================================
   DROP GATE INTO WORKSPACE
   ========================================================= */

workspace.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

    }
);


workspace.addEventListener(
    "drop",
    event => {

        event.preventDefault();


        const type =
            event.dataTransfer.getData(
                "gate"
            );


        if (
            !type
        ) {

            return;

        }


        const rect =
            canvas.getBoundingClientRect();


        createGate(

            type,

            Math.max(

                10,

                (
                    event.clientX -
                    rect.left
                ) / zoom - 75

            ),

            Math.max(

                10,

                (
                    event.clientY -
                    rect.top
                ) / zoom - 50

            )

        );


        renderAll();

        calculate();

        pushHistory();


        status(
            type +
            " gate added"
        );

    }
);


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

document
    .getElementById(
        "addInputBtn"
    )
    .onclick = () => {

        const count =
            nodes.filter(
                n =>
                    n.type ===
                    "INPUT"
            ).length;


        createInput(

            60,

            80 +
            count * 100,

            "INPUT" +
            (count + 1)

        );


        renderAll();

        calculate();

        pushHistory();

    };


document
    .getElementById(
        "addOutputBtn"
    )
    .onclick = () => {

        const count =
            nodes.filter(
                n =>
                    n.type ===
                    "OUTPUT"
            ).length;


        createOutput(

            700,

            100 +
            count * 100,

            "OUTPUT" +
            (count + 1)

        );


        renderAll();

        calculate();

        pushHistory();

    };


/* =========================================================
   UNDO / REDO
   ========================================================= */

document
    .getElementById(
        "undoBtn"
    )
    .onclick =
    undo;


document
    .getElementById(
        "redoBtn"
    )
    .onclick =
    redo;


/* =========================================================
   SAVE / LOAD
   ========================================================= */

document
    .getElementById(
        "saveBtn"
    )
    .onclick =
    saveCircuit;


document
    .getElementById(
        "loadBtn"
    )
    .onclick = () => {

        document
            .getElementById(
                "fileInput"
            )
            .click();

    };


document
    .getElementById(
        "fileInput"
    )
    .onchange =
    event => {

        const file =
            event.target.files[0];


        if (
            file
        ) {

            loadCircuit(
                file
            );

        }

    };


/* =========================================================
   RESET INPUTS
   ========================================================= */

document
    .getElementById(
        "resetBtn"
    )
    .onclick =
    resetInputs;


/* =========================================================
   DELETE
   ========================================================= */

document
    .getElementById(
        "deleteBtn"
    )
    .onclick =
    deleteSelected;


/* =========================================================
   CLEAR
   ========================================================= */

document
    .getElementById(
        "clearBtn"
    )
    .onclick =
    clearCircuit;


/* =========================================================
   RENAME
   ========================================================= */

document
    .getElementById(
        "renameBtn"
    )
    .onclick =
    renameSelected;


/* =========================================================
   VALIDATE
   ========================================================= */

document
    .getElementById(
        "validateBtn"
    )
    .onclick =
    validateCircuit;


/* =========================================================
   SHOW EXPRESSION
   ========================================================= */

document
    .getElementById(
        "expressionBtn"
    )
    .onclick =
    updateExpression;


/* =========================================================
   GATE TRUTH TABLE
   ========================================================= */

document
    .getElementById(
        "truthTableBtn"
    )
    .onclick =
    showGateTruthTable;


/* =========================================================
   CIRCUIT TRUTH TABLE
   ========================================================= */

document
    .getElementById(
        "circuitTruthBtn"
    )
    .onclick =
    showCircuitTruthTable;


/* =========================================================
   ZOOM IN
   ========================================================= */

document
    .getElementById(
        "zoomInBtn"
    )
    .onclick = () => {

        setZoom(
            zoom + 0.1
        );

    };


/* =========================================================
   ZOOM OUT
   ========================================================= */

document
    .getElementById(
        "zoomOutBtn"
    )
    .onclick = () => {

        setZoom(
            zoom - 0.1
        );

    };


/* =========================================================
   ZOOM RESET
   ========================================================= */

document
    .getElementById(
        "zoomResetBtn"
    )
    .onclick = () => {

        setZoom(
            1
        );

    };


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Delete"
        ) {

            deleteSelected();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
            "z"
        ) {

            event.preventDefault();

            undo();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
            "y"
        ) {

            event.preventDefault();

            redo();

        }

    }
);


/* =========================================================
   DARK MODE
   ========================================================= */

document
    .getElementById(
        "themeBtn"
    )
    .onclick = () => {

        document.body.classList.toggle(
            "dark"
        );


        const dark =
            document.body.classList.contains(
                "dark"
            );


        document
            .getElementById(
                "themeBtn"
            )
            .textContent =

            dark

                ? "☀ Light Mode"

                : "🌙 Dark Mode";


        localStorage.setItem(

            "logicDark",

            dark
                ? "1"
                : "0"

        );

    };


/* =========================================================
   LOAD SAVED THEME
   ========================================================= */

if (
    localStorage.getItem(
        "logicDark"
    ) === "1"
) {

    document.body.classList.add(
        "dark"
    );


    document
        .getElementById(
            "themeBtn"
        )
        .textContent =
        "☀ Light Mode";

}


/* =========================================================
   CHALLENGE MODE
   ========================================================= */

const challenges = [

    {
        question:
            "Build an AND circuit with two inputs and one output.",

        type:
            "AND"
    },

    {
        question:
            "Build an OR circuit with two inputs and one output.",

        type:
            "OR"
    },

    {
        question:
            "Build a NOT circuit with one input and one output.",

        type:
            "NOT"
    },

    {
        question:
            "Build a NAND circuit with two inputs and one output.",

        type:
            "NAND"
    },

    {
        question:
            "Build an XOR circuit with two inputs and one output.",

        type:
            "XOR"
    }

];


/* =========================================================
   START CHALLENGE
   ========================================================= */

function startChallenge() {

    challenge =
        challenges[
            Math.floor(
                Math.random() *
                challenges.length
            )
        ];


    document
        .getElementById(
            "challengeBox"
        )
        .innerHTML = `

            <b>
                ${challenge.question}
            </b>

            <br><br>

            <button
                class="challenge-btn"
                id="checkChallenge">

                Check Answer

            </button>

        `;


    document
        .getElementById(
            "checkChallenge"
        )
        .onclick =
        checkChallenge;

}


/* =========================================================
   CHECK CHALLENGE
   ========================================================= */

function checkChallenge() {

    if (
        !challenge
    ) {

        startChallenge();

        return;

    }


    const gates =
        nodes.filter(
            node =>
                logic[node.type]
        );


    const inputs =
        nodes.filter(
            node =>
                node.type ===
                "INPUT"
        );


    const outputs =
        nodes.filter(
            node =>
                node.type ===
                "OUTPUT"
        );


    let correct =

        gates.length === 1 &&

        gates[0].type ===
        challenge.type &&

        outputs.length === 1;


    /*
       Check number of inputs
    */

    if (
        correct
    ) {

        const requiredInputs =

            challenge.type ===
            "NOT"

                ? 1
                : 2;


        correct =

            inputs.length ===
            requiredInputs;

    }


    /*
       Check gate -> output
    */

    if (
        correct
    ) {

        correct =

            connections.some(

                connection =>

                    connection.from ===
                    gates[0].id &&

                    connection.to ===
                    outputs[0].id

            );

    }


    /*
       Check gate inputs
    */

    if (
        correct
    ) {

        const requiredInputs =

            challenge.type ===
            "NOT"

                ? 1
                : 2;


        for (
            let i = 0;
            i < requiredInputs;
            i++
        ) {

            const connected =

                connections.some(

                    connection =>

                        connection.to ===
                        gates[0].id &&

                        connection.port ===
                        "input" + i

                );


            if (
                !connected
            ) {

                correct =
                    false;

                break;

            }

        }

    }


    document
        .getElementById(
            "challengeBox"
        )
        .innerHTML =

        correct

            ?

            `

            <b class="success">

                🎉 Correct!
                Challenge completed.

            </b>

            <br><br>

            <button
                class="challenge-btn"
                onclick="startChallenge()">

                Next Challenge

            </button>

            `

            :

            `

            <b class="error">

                ✗ Not correct yet.

            </b>

            <br><br>

            <button
                class="challenge-btn"
                onclick="checkChallenge()">

                Check Again

            </button>

            `;

}


/* =========================================================
   CHALLENGE BUTTON FIX
   ========================================================= */

const challengeButton =
    document.getElementById(
        "challengeBtn"
    );


if (
    challengeButton
) {

    challengeButton.addEventListener(

        "click",

        event => {

            event.preventDefault();

            startChallenge();

        }

    );

}


/* =========================================================
   INITIAL DEMO CIRCUIT
   ========================================================= */

function createDemo() {

    const a =
        createInput(
            60,
            100,
            "A"
        );


    const b =
        createInput(
            60,
            300,
            "B"
        );


    const gate =
        createGate(
            "AND",
            330,
            180
        );


    const output =
        createOutput(
            650,
            205,
            "Y"
        );


    connections.push(

        {

            from:
                a.id,

            to:
                gate.id,

            port:
                "input0"

        },

        {

            from:
                b.id,

            to:
                gate.id,

            port:
                "input1"

        },

        {

            from:
                gate.id,

            to:
                output.id,

            port:
                "input0"

        }

    );


    renderAll();

    calculate();


    history = [

        snapshot()

    ];


    historyIndex =
        0;


    status(
        "Demo AND circuit ready"
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

createDemo();