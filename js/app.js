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
    var Invader = (function (_super) {
        __extends(Invader, _super);
        function Invader(game) {
            _super.call(this, game, 0, 0, PCGGame.Player.ID);
            // center the sprite horizontally
            this.anchor.x = 0.5;
            // center the sprite vertically
            this.anchor.y = 0.5;
            // enable physics for player
            game.physics.arcade.enable(this, false);
            // allow gravity
            var body = this.body;
            body.allowGravity = false;
        }
        Invader.ID = 'Invader';
        return Invader;
    }(Phaser.Sprite));
    PCGGame.Invader = Invader;
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
            var randomGenerator = game.rnd;
            // platforms generator
            this._generator = new Generator.Generator(randomGenerator);
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
            this._block = this._generator.addBlock(0, this.game.rnd.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), randomGenerator.integerInRange(1, 3));
            this._state = 0 /* PROCESS_BLOCK */;
        }
        MainLayer.prototype.render = function () {
            this._walls.forEachExists(function (sprite) {
                this.game.debug.body(sprite);
            }, this);
        };
        Object.defineProperty(MainLayer.prototype, "wallBlocks", {
            get: function () {
                return this._walls;
            },
            enumerable: true,
            configurable: true
        });
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
var PCGGame;
(function (PCGGame) {
    var Meteor = (function (_super) {
        __extends(Meteor, _super);
        function Meteor(game) {
            _super.call(this, game, 0, 0, PCGGame.Player.ID);
            // center the sprite horizontally
            this.anchor.x = 0.5;
            // center the sprite vertically
            this.anchor.y = 0.5;
            // enable physics for player
            game.physics.arcade.enable(this, false);
            // allow gravity
            var body = this.body;
            body.allowGravity = false;
        }
        Meteor.ID = 'Meteor';
        return Meteor;
    }(Phaser.Sprite));
    PCGGame.Meteor = Meteor;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Notch = (function (_super) {
        __extends(Notch, _super);
        function Notch(game) {
            _super.call(this, game, 0, 0, PCGGame.Player.ID);
            // center the sprite horizontally
            this.anchor.x = 0.5;
            // center the sprite vertically
            this.anchor.y = 0.5;
            // enable physics for player
            game.physics.arcade.enable(this, false);
            // allow gravity
            var body = this.body;
            body.allowGravity = false;
        }
        Notch.ID = 'Notch';
        return Notch;
    }(Phaser.Sprite));
    PCGGame.Notch = Notch;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(game) {
            _super.call(this, game, 0, 0, Player.ID);
            // center the sprite horizontally
            this.anchor.x = 0.5;
            // center the sprite vertically
            this.anchor.y = 0.5;
            // enable physics for player
            game.physics.arcade.enable(this, false);
            // allow gravity
            var body = this.body;
            body.allowGravity = false;
        }
        Player.ID = 'Player';
        return Player;
    }(Phaser.Sprite));
    PCGGame.Player = Player;
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
        //private _jumpTables: JumpTables;
        function Generator(randomGenerator) {
            this._randomGenerator = randomGenerator;
            // reference to jump tables
            //this._jumpTables = JumpTables.instance;
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
            // Y POSITION
            // how high can jump max
            var minY = -5; //0; //this._jumpTables.maxOffsetY();
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
            //block.offset.y = block.position.y - lastPosition.y;
            // X POSITION
            //let minX = this._jumpTables.minOffsetX(block.offset.y);
            //let maxX = this._jumpTables.maxOffsetX(block.offset.y);
            //console.log('Min Max : ', minY, minX, maxX);
            // position of next tile in x direction
            //let shiftX = this._randomGenerator.integerInRange(minX, maxX);
            var shiftX = this._randomGenerator.integerInRange(1, 5);
            // new absolute x position
            block.position.x = lastPosition.x + shiftX;
            // offset of new piece relative to last position (end position of last piece)
            block.offset.x = shiftX;
            // LENGTH
            block.length = this._randomGenerator.integerInRange(1, 1);
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
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            _super.apply(this, arguments);
            this._gameState = {
                end: false,
                paused: false
            };
            this._keysPressed = {
                fire: false
            };
            this._cursors = null;
        }
        Play.prototype.create = function () {
            var _this = this;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;
            //Generator.JumpTables.setDebug(true, PCGGame.Global);
            //this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
            //Generator.JumpTables.instance;
            console.log('test!');
            this._player = new PCGGame.Player(this.game);
            this._player.position.set(Generator.Parameters.GRID.CELL.SIZE, (PCGGame.Global.SCREEN.HEIGHT - Generator.Parameters.PLAYER.BODY.HEIGHT) / 2);
            this._mainLayer = new PCGGame.MainLayer(this.game, this.world);
            this.world.add(this._player);
            this._fireKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.game.input.onDown.add(function () {
                _this._keysPressed.fire = true;
                console.log('Mouse Fire Key Down!');
            }, this);
            this.game.input.onUp.add(function () {
                _this._keysPressed.fire = false;
                console.log('Mouse Fire Key Up!');
            }, this);
            this._cursors = this.game.input.keyboard.createCursorKeys();
        };
        Play.prototype.render = function () {
            this._mainLayer.render();
        };
        Play.prototype.update = function () {
            if (this._gameState.end || this._gameState.paused) {
                return;
            }
            this.updatePhysics();
            this.camera.x = this._player.x - Generator.Parameters.GRID.CELL.SIZE * 1.5;
            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE);
        };
        Play.prototype.updatePhysics = function () {
            var playerBody = this._player.body;
            var wallBlockCollision = this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks);
            if (wallBlockCollision && playerBody.touching.any) {
                playerBody.velocity.set(0, 0);
                return;
            }
            if (playerBody.velocity.x < 1) {
                playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            }
            if (this._cursors.left.isDown) {
                playerBody.velocity.x = Math.max(playerBody.velocity.x - 5, Generator.Parameters.VELOCITY.X);
            }
            else if (this._cursors.right.isDown) {
                playerBody.velocity.x = Math.max(playerBody.velocity.x + 5, Generator.Parameters.VELOCITY.X);
            }
            if (this._cursors.up.isDown) {
                this._player.position.y = Math.max(playerBody.halfHeight, this._player.position.y - 5);
            }
            else if (this._cursors.down.isDown) {
                this._player.position.y = Math.min(PCGGame.Global.SCREEN.HEIGHT - playerBody.halfHeight, this._player.position.y + 5);
            }
            console.log(wallBlockCollision);
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
            this.load.image(PCGGame.Player.ID, 'assets/ship.png');
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
//# sourceMappingURL=app.js.map