namespace Generator {
    export class JumpTables {

        private static _instance : any = null;
        private static _debug : boolean = false;
        private static _gameConfig : any;
        private static _debugBitMapData : Phaser.BitmapData;

        private _jumpVelocityImpulseLookup : number[] = [];


        // list of possible jumps for each jump velocity and position within cell
        private _jumpDefs: Jump[][][] = [];

        // results of jump table analysis
        private _jumpOffsetsY: number[] = [];
        private _jumpOffsetYMax: number = 0;
        private _jumpOffsetXMins: any = {};
        private _jumpOffsetXMaxs: any = {};


        public constructor() {
            this.calcJumpVelocityImpulses();
            this._calculateJumpTables();
        }

        public static get instance() : JumpTables {

            if ( JumpTables._instance === null) {
                JumpTables._instance = new JumpTables();
            }

            return JumpTables._instance;
        }

        public calcJumpVelocityImpulses() : void {

            let deltaJumHeight = Parameters.JUMP.HEIGHT.MAX - Parameters.JUMP.HEIGHT.MIN;
            this._jumpVelocityImpulseLookup.length = 0;

            for (let i = 0; i < Parameters.JUMP.HEIGHT.STEPS; i++) {
                let h = Parameters.JUMP.HEIGHT.MIN + (deltaJumHeight / Parameters.JUMP.HEIGHT.STEPS * i);

                this._jumpVelocityImpulseLookup.push(-Math.sqrt(2 * h * Parameters.GRAVITY));
            }

            console.log( this._jumpVelocityImpulseLookup);
        }

        // -------------------------------------------------------------------------
        public maxOffsetY(jumpIndex: number = -1): number {
            if (jumpIndex === -1) {
                return this._jumpOffsetYMax;
            } else {
                return this._jumpOffsetsY[jumpIndex];
            }
        }

        // -------------------------------------------------------------------------
        public maxOffsetX(offsetY: number): number {
            let maxX = this._jumpOffsetXMaxs[offsetY];

            if (typeof maxX === "undefined") {
                console.error("max X for offset y = " + offsetY + " does not exist");
                maxX = 0;
            }

            return maxX;
        }

        public minOffsetX(offsetY: number): number {
            let minX = this._jumpOffsetXMins[offsetY];

            if (typeof minX === "undefined") {
                console.error("min X for offset y = " + offsetY + " does not exist");
                minX = 0;
            }

            return minX;
        }


        public get minJumpVelocity(): number {
            return this._jumpVelocityImpulseLookup[0];
        }

        // -------------------------------------------------------------------------
        public get maxJumpVelocity(): number {
            return this._jumpVelocityImpulseLookup[this._jumpVelocityImpulseLookup.length - 1];
        }


        public static createDebugBitmap() {
            let gameConf = JumpTables._gameConfig;

            let bitMapData = new Phaser.BitmapData(
                gameConf.game, 'DebugGrid', gameConf.SCREEN.WIDTH, gameConf.SCREEN.HEIGHT
            );

            bitMapData.fill(200,200,200);

            for (let i = 0; i < gameConf.SCREEN.HEIGHT; i += Parameters.GRID.CELL.SIZE ) {
                bitMapData.line(0, i + 0.5, gameConf.SCREEN.WIDTH - 1, i + 0.5)
            }

            let offset = Parameters.GRID.CELL.SIZE / 3;

            for (let j = 0; j < gameConf.SCREEN.WIDTH; j += Parameters.GRID.CELL.SIZE ) {
                bitMapData.line(j + 0.5, 0, j + 0.5, gameConf.SCREEN.HEIGHT - 1);
                bitMapData.text((j/Parameters.GRID.CELL.SIZE).toString(), j + offset, 20, '12px Courier', '#00ff00');
            }

            JumpTables._debugBitMapData = bitMapData;
        }

        public static setDebug(isDebugOn: boolean, gameConfig?: any): void {

            if (! JumpTables._instance) {
                this.instance;
            }

            JumpTables._debug = isDebugOn;

            if (typeof gameConfig !== 'undefined') {
                JumpTables._gameConfig = gameConfig;
            }

            if (! isDebugOn || ! gameConfig) {
                return;
            }

            JumpTables.createDebugBitmap();

        }

        public static get debugBitmapData() : Phaser.BitmapData {
            return JumpTables._debugBitMapData;
        }

        private _calculateJumpTables(): void {
            // all jump velocities
            for (let height = 0; height < Parameters.JUMP.HEIGHT.STEPS; height++) {

                this._jumpDefs[height] = [];

                // step from left to right on cell
                for (let step = 0; step < Parameters.GRID.CELL.STEPS; step++) {
                    this._calculateJumpCurve(step, height);
                }
            }

            // analyze created jump tables
            this._analyzeJumpTables();
        }

        // -------------------------------------------------------------------------
        private _calculateJumpCurve(step: number, jumpIndex: number): void {
            // simulation timestep
            let timeStep = 1 / 60;

            // take jump velocity we calculated previously
            let velocity = this._jumpVelocityImpulseLookup[jumpIndex];

            // start at middle of first step to spread samples better over cell
            // x and y positions are in pixels
            let x = step * Parameters.GRID.CELL.SIZE / Parameters.GRID.CELL.STEPS
                + Parameters.GRID.CELL.SIZE / Parameters.GRID.CELL.STEPS / 2;
            let y = 0;
            // y position in cells coordinates (row within grid)
            let cellY = 0;

            // help variables to track previous position
            let prevX : number, prevY : number;

            // array of jumps from starting position to possible destinations
            let jumpDefs: Jump[] = [];
            // helper object that will help us keep track of visited cells
            let visitedList : any = {};

            // half of player body width
            let playerWidthHalf = Parameters.PLAYER.BODY.WIDTH / 2 * 0.5;


            // debug
            let debugBitmap = (JumpTables._debug) ? JumpTables.debugBitmapData : null;
            // offset drawing of curve little bit down (by 4 cells),
            // otherwise it will be cut at top as we start jump at point [x, 0]
            let yOffset = Parameters.GRID.CELL.SIZE * 4;


            // simulate physics
            while (cellY < Parameters.GRID.HEIGHT) {
                // save previous position
                prevX = x;
                prevY = y;

                // adjust velocity
                velocity += Parameters.GRAVITY * timeStep;

                // new posiiton
                y += velocity * timeStep;
                x += Parameters.VELOCITY.X * timeStep;

                // draw path - small white dot
                if (JumpTables._debug) {
                    debugBitmap.rect(x, y+ yOffset, 2, 2, "#FFFFFF");
                }

                // left and right bottom point based on body width.
                let leftCell : number, rightCell : number;
                cellY = Math.floor(y / Parameters.GRID.CELL.SIZE);

                // falling down
                if (velocity > 0) {
                    // crossed cell border to next vertical cell?
                    if (cellY > Math.floor(prevY / Parameters.GRID.CELL.SIZE)) {
                        // calc as intersection of line from prev. position and current position with grid horizontal line
                        let pixelBorderY = Math.floor(y / Parameters.GRID.CELL.SIZE) * Parameters.GRID.CELL.SIZE;
                        let pixelBorderX = prevX + (x - prevX) * (pixelBorderY - prevY) / (y - prevY);

                        leftCell = Math.floor((pixelBorderX - playerWidthHalf) / Parameters.GRID.CELL.SIZE);
                        rightCell = Math.floor((pixelBorderX + playerWidthHalf) / Parameters.GRID.CELL.SIZE);

                        // all cells in x direction occupied with body
                        for (let i = leftCell; i <= rightCell; i++) {
                            let visitedId = i + (cellY << 8);

                            // if not already in list, then add new jump to reach this cell
                            if (typeof visitedList[visitedId] === "undefined") {
                                let jump = new Jump();

                                jump.offsetX = i;
                                jump.offsetY = cellY;

                                jumpDefs.push(jump);

                                //console.log(jump.toString());
                            }
                        }

                        // debug
                        if (JumpTables._debug) {
                            // debug draw
                            let py = pixelBorderY + yOffset;

                            // line with original body width
                            let color = "#4040FF";
                            let pxLeft = pixelBorderX - Parameters.PLAYER.BODY.WIDTH / 2;
                            let pxRight = pixelBorderX + Parameters.PLAYER.BODY.WIDTH / 2;

                            debugBitmap.line(pxLeft, py, pxRight, py, color);

                            color = "#0000FF";
                            pxLeft = pixelBorderX - playerWidthHalf;
                            pxRight = pixelBorderX + playerWidthHalf;

                            // line with shortened body width
                            debugBitmap.line(pxLeft, py, pxRight, py, color);
                            debugBitmap.line(pxLeft, py - 3, pxLeft, py + 3, color);
                            debugBitmap.line(pxRight, py - 3, pxRight, py + 3, color);
                        }
                    }
                }


                leftCell = Math.floor((x - playerWidthHalf) / Parameters.GRID.CELL.SIZE);
                rightCell = Math.floor((x + playerWidthHalf) / Parameters.GRID.CELL.SIZE);

                // add grid cells to visited
                for (let i = leftCell; i <= rightCell; i++) {
                    // make "id"
                    let visitedId = i + (cellY << 8);
                    if (typeof visitedList[visitedId] === "undefined") {
                        visitedList[visitedId] = visitedId;
                    }
                }
            }

            this._jumpDefs[jumpIndex][step] = jumpDefs;
            console.log(step, jumpIndex, this._jumpDefs[jumpIndex][step]);
        }

// -------------------------------------------------------------------------
        private _analyzeJumpTables(): void {
            // min y
            this._jumpOffsetYMax = 0;
            console.log( this._jumpDefs);

// through all jump velocities
            for (let velocity = 0; velocity < this._jumpDefs.length; velocity++) {
                // get only first x position within cell and first jump for given velocity,
                // because all have the same height
                this._jumpOffsetsY[velocity] = this._jumpDefs[velocity][0][0].offsetY;
                // check for maximum offset in y direction.
                // As it is negative number, we are looking for min in fact
                this._jumpOffsetYMax = Math.min(this._jumpOffsetYMax, this._jumpOffsetsY[velocity]);
            }


// find minimum and maximum offset in cells to jump to at given height level
            for (let velocity = 1; velocity < this._jumpDefs.length; velocity++) {

                // get only first startX, because it has smallest x offset
                let jumps = this._jumpDefs[velocity][0];

                for (let j = 0; j < jumps.length; j++) {
                    let jump = jumps[j];
                    let currentMin = this._jumpOffsetXMins[jump.offsetY];

                    this._jumpOffsetXMins[jump.offsetY] = (typeof currentMin !== "undefined") ?
                        Math.min(currentMin, jump.offsetX) : jump.offsetX;

                    console.log("LEVEL: " + jump.offsetY + " - jump from " + this.minOffsetX(jump.offsetY));
                }

                // get only last startX, because it has biggest x offset
                jumps = this._jumpDefs[velocity][this._jumpDefs[velocity].length - 1];

                for (let j = 0; j < jumps.length; j++) {
                    let jump = jumps[j];
                    let currentMax = this._jumpOffsetXMaxs[jump.offsetY];

                    this._jumpOffsetXMaxs[jump.offsetY] = (typeof currentMax !== "undefined") ?
                        Math.max(currentMax, jump.offsetX) : jump.offsetX;

                    console.log("LEVEL: " + jump.offsetY + " - jump to " + this.maxOffsetX(jump.offsetY));
                }
            }
        }



    }


}