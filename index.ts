const DEFAULT_FONT_SIZE = 24;

const THEME_BG: string = "#222436";
const THEME_FG: string = "#c8d3f5";
const THEME_BLUE: string = "#82aaff";
const THEME_RED: string = "#ff757f";
const THEME_GRAY: string = "#3b4261";
const THEME_BLACK: string = "#0b0c16";

enum Mode {
    Normal = "NOR",
    Insert = "INS",
}

// class Cell {
//     char: string;
//     background: string;
//     foreground: string;
//
//     constructor(c: string, fg: string = THEME_FG, bg: string = THEME_BG) {
//         this.char = c;
//         this.background = bg;
//         this.foreground = fg;
//     }
//
//     draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
//         ctx.fillStyle = this.foreground;
//         ctx.fillText(this.char, x, y);
//     }
// }

class Buffer {
    name: string;
    lines: Array<string>;
    currentRow: number;
    currentCol: number;
    previousCurrentCol: number;
    // scroll: number;

    constructor(name: string = "[no name]") {
        this.name = name;
        this.lines = [""];
        this.currentRow = 0;
        this.currentCol = 0;
        this.previousCurrentCol = 0;
        // this.scroll = 0;
    }

    loadFromString(content: string) {
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            this.lines[i] = lines[i];
        }
    }

    getCurrentLine(): string {
        return this.lines[this.currentRow/* + this.scroll*/];
    }

    setCurrentLine(value: string) {
        this.lines[this.currentRow/* + this.scroll*/] = value;
    }

    insertChar(char: string) {
        let currentLine: string = this.lines[this.currentRow];
        let newText = currentLine.slice(0, this.currentCol) + char + currentLine.slice(this.currentCol);
        this.lines[this.currentRow] = newText;
        this.currentCol += char.length;
        this.previousCurrentCol = this.currentCol;
    }

    deleteChar() {
        if (this.currentCol > 0) {
            let currentLine: string = this.lines[this.currentRow];
            let modifiedText = currentLine.slice(0, this.currentCol - 1) + currentLine.slice(this.currentCol);
            this.lines[this.currentRow] = modifiedText;
            this.currentCol -= 1;
        }
    }

    deleteCharUnderCursor() {
        if (this.currentCol > 0) {
            let currentLine: string = this.lines[this.currentRow];
            let modifiedText = currentLine.slice(0, this.currentCol) + currentLine.slice(this.currentCol + 1);
            this.lines[this.currentRow] = modifiedText;
        }
    }

    breakLine() {
        this.currentRow += 1;

        if (!this.lines[this.currentRow]) {
            this.lines[this.currentRow] = "";
            this.currentCol = 0;
            this.previousCurrentCol = this.currentCol;
        }
    }

    insertLineBellow() {
        this.lines.splice(this.currentRow + 1, 0, "");
        this.currentRow += 1;

        if (!this.lines[this.currentRow]) {
            this.lines[this.currentRow] = "";
        }

        this.currentCol = 0;
        this.previousCurrentCol = this.currentCol;
    }

    insertLineAbove() {
        this.lines.splice(this.currentRow, 0, "");

        if (!this.lines[this.currentRow]) {
            this.lines[this.currentRow] = "";
        }

        this.currentCol = 0;
        this.previousCurrentCol = this.currentCol;
    }

    moveCursorLeft() {
        if (this.currentCol > 0) {
            this.currentCol -= 1;
            this.previousCurrentCol = this.currentCol;
        }
    }

    moveCursorRight(key: string) {
        if (this.currentCol < this.getCurrentLine().length - 1) {
            this.currentCol += 1;
            this.previousCurrentCol = this.currentCol;
        } else if (key === "KeyA") {
            this.currentCol += 1;
            this.previousCurrentCol = this.currentCol;
        }
    }

    moveCursorUp() {
        if (this.currentRow > 0) {
            this.currentRow -= 1;
        }

        if (this.getCurrentLine().length === 0) {
            this.currentCol = 0;
        } else {
            this.currentCol = this.previousCurrentCol;
        }

        if (
            this.currentCol >= this.getCurrentLine().length &&
            this.currentCol !== 0
        ) {
            this.currentCol = this.getCurrentLine().length - 1;
        }
    }

    moveCursorDown() {
        if (this.currentRow < this.lines.length - 1) {
            this.currentRow += 1;
        }

        // if (buf.currentRow*28 > canvas.height - 28*4) {
        //     this.scroll += 1;
        // }


        // this.scroll += 1;

        if (this.getCurrentLine().length === 0) {
            this.currentCol = 0;
        } else {
            this.currentCol = this.previousCurrentCol;
        }

        if (
            this.currentCol >= this.getCurrentLine().length &&
            this.currentCol !== 0
        ) {
            this.currentCol = this.getCurrentLine().length - 1;
        }
    }

    moveCursorBegin() {
        this.currentCol = 0;
        this.previousCurrentCol = 0;
    }

    moveCursorEnd() {
        this.currentCol = this.getCurrentLine().length;
        this.previousCurrentCol = this.currentCol;
    }

    jumpNextWord() {
        let foundNextWord = false;
        let nextWordIndex = 0;

        for (let row = this.currentRow; row < this.lines.length; row++) {
            for (let col = this.currentCol; col < this.getCurrentLine().length; col++) {
                let line = this.getCurrentLine();

                if (line[col] === ' ') {
                    if (col + 1 < line.length && line[col+1] !== ' ') {
                        nextWordIndex = col+1;
                        foundNextWord = true;
                        break;
                    }
                }
            }

            if (foundNextWord) break;

            this.currentRow += 1;
            this.currentCol = 0;

            break;
        }

        this.currentCol = nextWordIndex;
        this.previousCurrentCol = this.currentCol;
    }

    jumpPrevWord() {
        let prevWordIndex = 0;

        for (let row = this.currentRow; row >= 0; row--) {
            let line = this.getCurrentLine();
            let col = this.currentCol;

            while (col >= 0 && line[col] === ' ') col--;

            if (col <= 0) {
                this.currentRow -= 1;
                this.currentCol = this.getCurrentLine().length - 1;
                continue;
            }

            while (col >= 0 && line[col] !== ' ') col--;

            prevWordIndex = col;
            break;
        }

        this.currentCol = prevWordIndex;
        this.previousCurrentCol = this.currentCol;
    }
}


function handleEvent() {
    window.addEventListener("keydown", e => {
        switch (mode) {
            case Mode.Normal:
                if (e.shiftKey) {
                    switch (e.code) {
                        case "KeyO":
                            buf.insertLineAbove();
                            mode = Mode.Insert;
                            break;
                        case "KeyA":
                            buf.moveCursorEnd();
                            mode = Mode.Insert;
                            break;
                        case "KeyW":
                            buf.jumpNextWord();
                            break;
                        case "KeyB":
                            buf.jumpPrevWord();
                            break;
                        default: break;
                    }
                } else if (e.ctrlKey) {
                    switch (e.code) {
                        case "Equal":
                            e.preventDefault();
                            fontSize += 1;
                            break;
                        case "Minus":
                            e.preventDefault();
                            fontSize -= 1;
                            break;
                        case "Digit0":
                            e.preventDefault();
                            fontSize = DEFAULT_FONT_SIZE;
                            break;
                        default: break;
                    }
                } else {
                    switch (e.code) {
                        case "KeyI": mode = Mode.Insert; break;
                        case "KeyH": case "ArrowLeft":  buf.moveCursorLeft(); break;
                        case "KeyL": case "ArrowRight": buf.moveCursorRight(e.code); break;
                        case "KeyK": case "ArrowUp":    buf.moveCursorUp(); break;
                        case "KeyJ": case "ArrowDown":  buf.moveCursorDown(); break;
                        case "KeyA": buf.moveCursorRight(e.code); mode = Mode.Insert; break;
                        case "KeyX": buf.deleteCharUnderCursor(); break;
                        case "Digit0": buf.moveCursorBegin(); break;
                        case "KeyO":
                            buf.insertLineBellow();
                            mode = Mode.Insert;
                            break;
                    }
                }
                break;

            case Mode.Insert:
                if (e.ctrlKey) {
                    switch (e.code) {
                        case "KeyC":
                            e.preventDefault();
                            mode = Mode.Normal;
                            buf.moveCursorLeft();
                            break;
                        default: break;
                    }
                } else {
                    switch (e.code) {
                        case "Escape": case "CapsLock":
                            e.preventDefault();
                            mode = Mode.Normal;
                            buf.moveCursorLeft();
                            break;
                        case "Tab":          e.preventDefault(); buf.insertChar("    "); break;
                        case "Backspace":    buf.deleteChar(); break;
                        case "Enter":        buf.breakLine(); break;
                        case "MetaLeft":     break;
                        case "MetaRight":    break;
                        case "ShiftLeft":    break;
                        case "ShiftRight":   break;
                        case "ControlLeft":  break;
                        case "ControlRight": break;
                        default: buf.insertChar(e.key); break;
                    }
                }
                break;
        }
    })
}

const canvas = document.querySelector<HTMLCanvasElement>("#editor")!;

const ctx = canvas.getContext("2d")!;

let file: string = "";

let buf = new Buffer();

fetch("index.ts")
    .then(res => res.text())
    .then(text => {
        file = text
        buf.loadFromString(file);
        console.log(file);
    })
    .catch(e => console.error("Fetch file:", e));


let mode: Mode = Mode.Normal;

let fontSize: number = DEFAULT_FONT_SIZE;

canvas.width = 800;
canvas.height = 800;

ctx.font = `${fontSize}px monospace`;

handleEvent();

const draw = () => {
    ctx.fillStyle = THEME_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textBaseline = "bottom";
    ctx.font = `${fontSize}px monospace`;

    const textMetrics = ctx.measureText('A');

    let fontWidth = Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
    let fontHeight = Math.abs(textMetrics.fontBoundingBoxAscent) + Math.abs(textMetrics.fontBoundingBoxDescent);

    let cursorLeft = textMetrics.width;

    // Line Number
    ctx.fillStyle = THEME_BG;
    ctx.fillRect(0, 0, fontWidth*4, canvas.height);

    for (let row = 0; row < buf.lines.length; row++) {
        let lineNumber = `${row+1}`
        if (row+1 > 9) { lineNumber.padEnd(1, " ") } else{ lineNumber.padEnd(3, " ") }
        ctx.fillStyle = buf.currentRow === row ? THEME_FG : THEME_GRAY;
        ctx.fillText(lineNumber, textMetrics.actualBoundingBoxLeft, fontHeight*(row+1));
    }

    // Cursor
    ctx.fillStyle = THEME_BLUE;
    ctx.fillRect(
        fontWidth*4 + cursorLeft*buf.currentCol,
        Math.floor(fontHeight*buf.currentRow),
        mode === Mode.Insert ? fontWidth/6: fontWidth,
        fontHeight
    );

    // Text Buffer
    for (let row = 0; row < buf.lines.length; row++) {
        ctx.fillStyle = THEME_FG;
        ctx.fillText(buf.lines[row], fontWidth*4 + textMetrics.actualBoundingBoxLeft, fontHeight*(row+1));
    }

    const statuslineY = canvas.height - fontHeight;

    // Statusline
    ctx.fillStyle = THEME_BLACK;
    ctx.fillRect(0, statuslineY, canvas.width, fontHeight);

    let rowColLabel = ` ${buf.currentRow+1}:${buf.currentCol+1} `;

    ctx.fillStyle = THEME_FG;
    ctx.fillText(` ${mode} ${buf.name}`, textMetrics.actualBoundingBoxLeft, statuslineY+fontHeight);
    ctx.fillText(rowColLabel, canvas.height - fontWidth*rowColLabel.length, statuslineY+fontHeight);

    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw)

// vim:ts=4:sw=4:sts=4
