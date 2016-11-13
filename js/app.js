var PCGGame;
(function (PCGGame) {
    var Global = (function () {
        function Global() {
        }
        Global.SCREEN = {
            WIDTH: 1024,
            HEIGHT: 640
        };
        return Global;
    }());
    PCGGame.Global = Global;
})(PCGGame || (PCGGame = {}));
window.onload = function () {
    PCGGame.Global.game = new PCGGame.Game();
};
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PCGGame;
(function (PCGGame) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            _super.apply(this, arguments);
        }
        Boot.prototype.create = function () {
            this.game.state.start('Preload');
        };
        return Boot;
    }(Phaser.State));
    PCGGame.Boot = Boot;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            // initialize the game
            _super.call(this, PCGGame.Global.SCREEN.WIDTH, PCGGame.Global.SCREEN.HEIGHT, Phaser.AUTO, 'pcg-content');
            // add states to state manager
            this.state.add('Boot', PCGGame.Boot);
            this.state.add('Preload', PCGGame.Preload);
            this.state.add('Play', PCGGame.Play);
            // begin game execution
            this.state.start('Boot');
        }
        return Game;
    }(Phaser.Game));
    PCGGame.Game = Game;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            _super.apply(this, arguments);
        }
        Play.prototype.create = function () {
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;
            //Generator.JumpTables.setDebug(true, PCGGame.Global);
            //this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
            Generator.JumpTables.instance;
            console.log('test!');
            this._mainLayer = new PCGGame.MainLayer(this.game, this.world);
        };
        Play.prototype.render = function () {
            this._mainLayer.render();
        };
        Play.prototype.update = function () {
            this.camera.x += this.time.physicsElapsed * Generator.Parameters.VELOCITY.X / 2;
            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE);
        };
        return Play;
    }(Phaser.State));
    PCGGame.Play = Play;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Preload = (function (_super) {
        __extends(Preload, _super);
        function Preload() {
            _super.apply(this, arguments);
            this._isGameReady = false;
        }
        Preload.prototype.create = function () {
        };
        Preload.prototype.preload = function () {
            this.load.image('gridTiles', 'assets/grid-tiles.png');
        };
        Preload.prototype.update = function () {
            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        };
        return Preload;
    }(Phaser.State));
    PCGGame.Preload = Preload;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    ;
    var MainLayer = (function (_super) {
        __extends(MainLayer, _super);
        function MainLayer(game, parent) {
            _super.call(this, game, parent);
            this._lastTile = new Phaser.Point(0, 0);
            // piece generated with generator
            this._block = null;
            // platforms generator
            this._generator = new Generator.Generator(game.rnd);
            // pool of walls
            this._wallsPool = new Helper.Pool(Phaser.Sprite, Generator.Parameters.GRID.CELL.SIZE / 2, function () {
                var sprite = new Phaser.Sprite(game, 0, 0, 'Block');
                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                var body = sprite.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                return sprite;
            });
            // walls group
            this._walls = new Phaser.Group(game, this);
            // set initial tile for generating
            this._block = this._generator.addBlock(0, 5, 10);
            this._state = 0 /* PROCESS_BLOCK */;
        }
        MainLayer.prototype.render = function () {
            this._walls.forEachExists(function (sprite) {
                this.game.debug.body(sprite);
            }, this);
        };
        MainLayer.prototype.generate = function (leftTile) {
            // remove tiles too far to left
            this._cleanTiles(leftTile);
            // width of screen rounded to whole tiles up
            var width = Math.ceil(this.game.width / Generator.Parameters.GRID.CELL.SIZE);
            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastTile.x < leftTile + width) {
                switch (this._state) {
                    case 0 /* PROCESS_BLOCK */:
                        this._lastTile.copyFrom(this._block.position);
                        var length_1 = this._block.length;
                        // process piece
                        while (length_1 > 0) {
                            this._addBlock(this._lastTile.x, this._lastTile.y);
                            if ((--length_1) > 0) {
                                ++this._lastTile.x;
                            }
                        }
                        // return processed piece into pool
                        this._generator.destroyBlock(this._block);
                        // generate next platform
                        this._state = 1 /* GENERATE_BLOCK */;
                        break;
                    case 1 /* GENERATE_BLOCK */:
                        this._block = this._generator.generate(this._lastTile);
                        this._state = 0 /* PROCESS_BLOCK */;
                        break;
                }
            }
        };
        MainLayer.prototype._cleanTiles = function (leftTile) {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (var i = this._walls.length - 1; i >= 0; i--) {
                var wall = this._walls.getChildAt(i);
                if (wall.x - leftTile <= -64) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallsPool.destroyItem(wall);
                }
            }
        };
        MainLayer.prototype._addBlock = function (x, y) {
            // sprite  get from pool
            var sprite = this._wallsPool.createItem();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            sprite.exists = true;
            sprite.visible = true;
            // add into walls group
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        };
        return MainLayer;
    }(Phaser.Group));
    PCGGame.MainLayer = MainLayer;
})(PCGGame || (PCGGame = {}));
var Generator;
(function (Generator) {
    var Block = (function () {
        function Block() {
            // absolute position of left cell / tile
            this.position = new Phaser.Point(0, 0);
            // offset from end of previous piece
            this.offset = new Phaser.Point(0, 0);
        }
        return Block;
    }());
    Generator.Block = Block;
})(Generator || (Generator = {}));
var Generator;
(function (Generator_1) {
    var Generator = (function () {
        function Generator(randomGenerator) {
            this._randomGenerator = randomGenerator;
            // reference to jump tables
            this._jumpTables = Generator_1.JumpTables.instance;
            // pool of block
            this._blockPool = new Helper.Pool(Generator_1.Block, 16);
        }
        Generator.prototype._createBlock = function () {
            var block = this._blockPool.createItem();
            console.log(block.position.x);
            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }
            return block;
        };
        Generator.prototype.destroyBlock = function (block) {
            this._blockPool.destroyItem(block);
        };
        Generator.prototype.addBlock = function (x, y, length, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = length;
            return block;
        };
        Generator.prototype.generate = function (lastPosition) {
            var block = this._createBlock();
            var upperBlockBound = 0;
            var lowerBlockBound = 768 / Generator_1.Parameters.GRID.CELL.SIZE;
            var deltaGridY = lowerBlockBound - upperBlockBound;
            console.log(lastPosition);
            // Y POSITION
            // how high can jump max
            var minY = this._jumpTables.maxOffsetY();
            // how deep can fall max
            var maxY = lowerBlockBound - upperBlockBound;
            // clear last y from upper bound, so it starts from 0
            var currentY = lastPosition.y - upperBlockBound;
            // new random y position - each y level on screen has the same probability
            var shiftY = this._randomGenerator.integerInRange(0, deltaGridY);
            // substract currentY from shiftY - it will split possible y levels to negative
            // (how much step up (-)) and positive (how much to step down (+))
            shiftY -= currentY;
            // clamp step to keep it inside interval given with maximum
            // jump offset up (minY) and maximum fall down (maxX)
            shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            // new level for platform
            // limit once more against game limits (2 free tiles on top, 1 water tile at bottom)
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);
            // shift by upper bound to get right y level on screen
            block.position.y = newY + upperBlockBound;
            // offset of new piece relative to last position (end position of last piece)
            block.offset.y = block.position.y - lastPosition.y;
            // X POSITION
            var minX = this._jumpTables.minOffsetX(block.offset.y);
            var maxX = this._jumpTables.maxOffsetX(block.offset.y);
            // position of next tile in x direction
            var shiftX = this._randomGenerator.integerInRange(minX, maxX);
            // new absolute x position
            block.position.x = lastPosition.x + shiftX;
            // offset of new piece relative to last position (end position of last piece)
            block.offset.x = shiftX;
            // LENGTH
            block.length = this._randomGenerator.integerInRange(1, 5);
            // RESULT
            this._lastGeneratedBlock = block;
            return block;
        };
        return Generator;
    }());
    Generator_1.Generator = Generator;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Jump = (function () {
        function Jump() {
            this.offsetY = 0;
            this.offsetX = 0;
        }
        // -------------------------------------------------------------------------
        Jump.prototype.toString = function () {
            return "offsetX: " + this.offsetX + ", offsetY: " + this.offsetY;
        };
        return Jump;
    }());
    Generator.Jump = Jump;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var JumpTables = (function () {
        function JumpTables() {
            this._jumpVelocityImpulseLookup = [];
            // list of possible jumps for each jump velocity and position within cell
            this._jumpDefs = [];
            // results of jump table analysis
            this._jumpOffsetsY = [];
            this._jumpOffsetYMax = 0;
            this._jumpOffsetXMins = {};
            this._jumpOffsetXMaxs = {};
            this.calcJumpVelocityImpulses();
            this._calculateJumpTables();
        }
        Object.defineProperty(JumpTables, "instance", {
            get: function () {
                if (JumpTables._instance === null) {
                    JumpTables._instance = new JumpTables();
                }
                return JumpTables._instance;
            },
            enumerable: true,
            configurable: true
        });
        JumpTables.prototype.calcJumpVelocityImpulses = function () {
            var deltaJumHeight = Generator.Parameters.JUMP.HEIGHT.MAX - Generator.Parameters.JUMP.HEIGHT.MIN;
            this._jumpVelocityImpulseLookup.length = 0;
            for (var i = 0; i < Generator.Parameters.JUMP.HEIGHT.STEPS; i++) {
                var h = Generator.Parameters.JUMP.HEIGHT.MIN + (deltaJumHeight / Generator.Parameters.JUMP.HEIGHT.STEPS * i);
                this._jumpVelocityImpulseLookup.push(-Math.sqrt(2 * h * Generator.Parameters.GRAVITY));
            }
            console.log(this._jumpVelocityImpulseLookup);
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.maxOffsetY = function (jumpIndex) {
            if (jumpIndex === void 0) { jumpIndex = -1; }
            if (jumpIndex === -1) {
                return this._jumpOffsetYMax;
            }
            else {
                return this._jumpOffsetsY[jumpIndex];
            }
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.maxOffsetX = function (offsetY) {
            var maxX = this._jumpOffsetXMaxs[offsetY];
            if (typeof maxX === "undefined") {
                console.error("max X for offset y = " + offsetY + " does not exist");
                maxX = 0;
            }
            return maxX;
        };
        JumpTables.prototype.minOffsetX = function (offsetY) {
            var minX = this._jumpOffsetXMins[offsetY];
            if (typeof minX === "undefined") {
                console.error("min X for offset y = " + offsetY + " does not exist");
                minX = 0;
            }
            return minX;
        };
        Object.defineProperty(JumpTables.prototype, "minJumpVelocity", {
            get: function () {
                return this._jumpVelocityImpulseLookup[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JumpTables.prototype, "maxJumpVelocity", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._jumpVelocityImpulseLookup[this._jumpVelocityImpulseLookup.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        JumpTables.createDebugBitmap = function () {
            var gameConf = JumpTables._gameConfig;
            var bitMapData = new Phaser.BitmapData(gameConf.game, 'DebugGrid', gameConf.SCREEN.WIDTH, gameConf.SCREEN.HEIGHT);
            bitMapData.fill(200, 200, 200);
            for (var i = 0; i < gameConf.SCREEN.HEIGHT; i += Generator.Parameters.GRID.CELL.SIZE) {
                bitMapData.line(0, i + 0.5, gameConf.SCREEN.WIDTH - 1, i + 0.5);
            }
            var offset = Generator.Parameters.GRID.CELL.SIZE / 3;
            for (var j = 0; j < gameConf.SCREEN.WIDTH; j += Generator.Parameters.GRID.CELL.SIZE) {
                bitMapData.line(j + 0.5, 0, j + 0.5, gameConf.SCREEN.HEIGHT - 1);
                bitMapData.text((j / Generator.Parameters.GRID.CELL.SIZE).toString(), j + offset, 20, '12px Courier', '#00ff00');
            }
            JumpTables._debugBitMapData = bitMapData;
        };
        JumpTables.setDebug = function (isDebugOn, gameConfig) {
            if (!JumpTables._instance) {
                this.instance;
            }
            JumpTables._debug = isDebugOn;
            if (typeof gameConfig !== 'undefined') {
                JumpTables._gameConfig = gameConfig;
            }
            if (!isDebugOn || !gameConfig) {
                return;
            }
            JumpTables.createDebugBitmap();
        };
        Object.defineProperty(JumpTables, "debugBitmapData", {
            get: function () {
                return JumpTables._debugBitMapData;
            },
            enumerable: true,
            configurable: true
        });
        JumpTables.prototype._calculateJumpTables = function () {
            // all jump velocities
            for (var height = 0; height < Generator.Parameters.JUMP.HEIGHT.STEPS; height++) {
                this._jumpDefs[height] = [];
                // step from left to right on cell
                for (var step = 0; step < Generator.Parameters.GRID.CELL.STEPS; step++) {
                    this._calculateJumpCurve(step, height);
                }
            }
            // analyze created jump tables
            this._analyzeJumpTables();
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype._calculateJumpCurve = function (step, jumpIndex) {
            // simulation timestep
            var timeStep = 1 / 60;
            // take jump velocity we calculated previously
            var velocity = this._jumpVelocityImpulseLookup[jumpIndex];
            // start at middle of first step to spread samples better over cell
            // x and y positions are in pixels
            var x = step * Generator.Parameters.GRID.CELL.SIZE / Generator.Parameters.GRID.CELL.STEPS
                + Generator.Parameters.GRID.CELL.SIZE / Generator.Parameters.GRID.CELL.STEPS / 2;
            var y = 0;
            // y position in cells coordinates (row within grid)
            var cellY = 0;
            // help variables to track previous position
            var prevX, prevY;
            // array of jumps from starting position to possible destinations
            var jumpDefs = [];
            // helper object that will help us keep track of visited cells
            var visitedList = {};
            // half of player body width
            var playerWidthHalf = Generator.Parameters.PLAYER.BODY.WIDTH / 2 * 0.5;
            // debug
            var debugBitmap = (JumpTables._debug) ? JumpTables.debugBitmapData : null;
            // offset drawing of curve little bit down (by 4 cells),
            // otherwise it will be cut at top as we start jump at point [x, 0]
            var yOffset = Generator.Parameters.GRID.CELL.SIZE * 4;
            // simulate physics
            while (cellY < Generator.Parameters.GRID.HEIGHT) {
                // save previous position
                prevX = x;
                prevY = y;
                // adjust velocity
                velocity += Generator.Parameters.GRAVITY * timeStep;
                // new posiiton
                y += velocity * timeStep;
                x += Generator.Parameters.VELOCITY.X * timeStep;
                // draw path - small white dot
                if (JumpTables._debug) {
                    debugBitmap.rect(x, y + yOffset, 2, 2, "#FFFFFF");
                }
                // left and right bottom point based on body width.
                var leftCell = void 0, rightCell = void 0;
                cellY = Math.floor(y / Generator.Parameters.GRID.CELL.SIZE);
                // falling down
                if (velocity > 0) {
                    // crossed cell border to next vertical cell?
                    if (cellY > Math.floor(prevY / Generator.Parameters.GRID.CELL.SIZE)) {
                        // calc as intersection of line from prev. position and current position with grid horizontal line
                        var pixelBorderY = Math.floor(y / Generator.Parameters.GRID.CELL.SIZE) * Generator.Parameters.GRID.CELL.SIZE;
                        var pixelBorderX = prevX + (x - prevX) * (pixelBorderY - prevY) / (y - prevY);
                        leftCell = Math.floor((pixelBorderX - playerWidthHalf) / Generator.Parameters.GRID.CELL.SIZE);
                        rightCell = Math.floor((pixelBorderX + playerWidthHalf) / Generator.Parameters.GRID.CELL.SIZE);
                        // all cells in x direction occupied with body
                        for (var i = leftCell; i <= rightCell; i++) {
                            var visitedId = i + (cellY << 8);
                            // if not already in list, then add new jump to reach this cell
                            if (typeof visitedList[visitedId] === "undefined") {
                                var jump = new Generator.Jump();
                                jump.offsetX = i;
                                jump.offsetY = cellY;
                                jumpDefs.push(jump);
                            }
                        }
                        // debug
                        if (JumpTables._debug) {
                            // debug draw
                            var py = pixelBorderY + yOffset;
                            // line with original body width
                            var color = "#4040FF";
                            var pxLeft = pixelBorderX - Generator.Parameters.PLAYER.BODY.WIDTH / 2;
                            var pxRight = pixelBorderX + Generator.Parameters.PLAYER.BODY.WIDTH / 2;
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
                leftCell = Math.floor((x - playerWidthHalf) / Generator.Parameters.GRID.CELL.SIZE);
                rightCell = Math.floor((x + playerWidthHalf) / Generator.Parameters.GRID.CELL.SIZE);
                // add grid cells to visited
                for (var i = leftCell; i <= rightCell; i++) {
                    // make "id"
                    var visitedId = i + (cellY << 8);
                    if (typeof visitedList[visitedId] === "undefined") {
                        visitedList[visitedId] = visitedId;
                    }
                }
            }
            this._jumpDefs[jumpIndex][step] = jumpDefs;
            console.log(step, jumpIndex, this._jumpDefs[jumpIndex][step]);
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype._analyzeJumpTables = function () {
            // min y
            this._jumpOffsetYMax = 0;
            console.log(this._jumpDefs);
            // through all jump velocities
            for (var velocity = 0; velocity < this._jumpDefs.length; velocity++) {
                // get only first x position within cell and first jump for given velocity,
                // because all have the same height
                this._jumpOffsetsY[velocity] = this._jumpDefs[velocity][0][0].offsetY;
                // check for maximum offset in y direction.
                // As it is negative number, we are looking for min in fact
                this._jumpOffsetYMax = Math.min(this._jumpOffsetYMax, this._jumpOffsetsY[velocity]);
            }
            // find minimum and maximum offset in cells to jump to at given height level
            for (var velocity = 1; velocity < this._jumpDefs.length; velocity++) {
                // get only first startX, because it has smallest x offset
                var jumps = this._jumpDefs[velocity][0];
                for (var j = 0; j < jumps.length; j++) {
                    var jump = jumps[j];
                    var currentMin = this._jumpOffsetXMins[jump.offsetY];
                    this._jumpOffsetXMins[jump.offsetY] = (typeof currentMin !== "undefined") ?
                        Math.min(currentMin, jump.offsetX) : jump.offsetX;
                    console.log("LEVEL: " + jump.offsetY + " - jump from " + this.minOffsetX(jump.offsetY));
                }
                // get only last startX, because it has biggest x offset
                jumps = this._jumpDefs[velocity][this._jumpDefs[velocity].length - 1];
                for (var j = 0; j < jumps.length; j++) {
                    var jump = jumps[j];
                    var currentMax = this._jumpOffsetXMaxs[jump.offsetY];
                    this._jumpOffsetXMaxs[jump.offsetY] = (typeof currentMax !== "undefined") ?
                        Math.max(currentMax, jump.offsetX) : jump.offsetX;
                    console.log("LEVEL: " + jump.offsetY + " - jump to " + this.maxOffsetX(jump.offsetY));
                }
            }
        };
        JumpTables._instance = null;
        JumpTables._debug = false;
        return JumpTables;
    }());
    Generator.JumpTables = JumpTables;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Parameters = (function () {
        function Parameters() {
        }
        Parameters.GRID = {
            HEIGHT: 24,
            CELL: {
                SIZE: 32,
                STEPS: 4
            },
            MIN_CELL: 0,
            MAX_CELL: 20
        };
        Parameters.GRAVITY = 2400;
        Parameters.PLAYER = {
            BODY: {
                WIDTH: 32,
                HEIGHT: 32
            }
        };
        Parameters.JUMP = {
            HEIGHT: {
                MIN: Parameters.GRID.CELL.SIZE * 0.75,
                MAX: Parameters.GRID.CELL.SIZE * 2.90,
                STEPS: Parameters.GRID.CELL.STEPS
            }
        };
        Parameters.VELOCITY = {
            X: 300
        };
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
var Helper;
(function (Helper) {
    var Pool = (function () {
        function Pool(classType, count, newItemFunction) {
            this._newItemFunction = null;
            this._itemCount = 0;
            this._pool = [];
            this._canGrow = true;
            this._poolSize = 0;
            this._classType = classType;
            this._newItemFunction = newItemFunction;
            for (var i = 0; i < count; i++) {
                // store into stack of free items
                this._pool.push(this.newItem());
                this._itemCount++;
            }
        }
        // create an item and decrease the pool size
        Pool.prototype.createItem = function () {
            if (this._itemCount === 0) {
                return this._canGrow ? this.newItem() : null;
            }
            else {
                return this._pool[--this._itemCount];
            }
        };
        // return an item to the pool to be reused later
        Pool.prototype.destroyItem = function (item) {
            this._pool[this._itemCount++] = item;
        };
        Pool.prototype.newItem = function () {
            var item = null;
            if (typeof this._newItemFunction === 'function') {
                item = this._newItemFunction();
            }
            else {
                item = new this._classType;
            }
            ++this._poolSize;
            return item;
        };
        Object.defineProperty(Pool.prototype, "newItemFunction", {
            set: function (newFunction) {
                this._newItemFunction = newFunction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pool.prototype, "canGrow", {
            set: function (canGrow) {
                this._canGrow = canGrow;
            },
            enumerable: true,
            configurable: true
        });
        return Pool;
    }());
    Helper.Pool = Pool;
})(Helper || (Helper = {}));
//# sourceMappingURL=app.js.map