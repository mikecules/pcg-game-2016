var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PCGGame;
(function (PCGGame) {
    var Animation = (function (_super) {
        __extends(Animation, _super);
        function Animation(game, parent) {
            _super.call(this, game, parent);
            this.animationStore = {};
            this.animationStore.explosion = new Phaser.Group(Animation._game, this);
            this.animationStore.explosion.createMultiple(30, Animation.EXPLODE_ID);
        }
        Animation.instance = function (game, parent) {
            if (game) {
                Animation._game = game;
            }
            if (parent) {
                Animation._parent = parent;
            }
            if (Animation._instance === null && Animation._game !== null && Animation._parent !== null) {
                Animation._instance = new Animation(Animation._game, Animation._parent);
            }
            return Animation._instance;
        };
        Animation.EXPLODE_ID = 'explode';
        Animation._game = null;
        Animation._parent = null;
        Animation._instance = null;
        return Animation;
    }(Phaser.Group));
    PCGGame.Animation = Animation;
})(PCGGame || (PCGGame = {}));
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
var PCGGame;
(function (PCGGame) {
    var BackgroundLayer = (function (_super) {
        __extends(BackgroundLayer, _super);
        function BackgroundLayer(game, parent) {
            _super.call(this, game, parent);
            this._starWidth = 0;
            this._nextFarthestStarX = 0;
            this._nextClosestStarX = 0;
            this._prevX = -1;
            this._starWidth = this.game.cache.getImage(BackgroundLayer.STAR_ID).width;
            this._fartherStars = new Phaser.Group(game, this);
            this._fartherStars.createMultiple(Math.round(BackgroundLayer.MAX_STARS * 3), BackgroundLayer.STAR_ID, 0, true);
            this._closerStars = new Phaser.Group(game, this);
            this._closerStars.createMultiple(BackgroundLayer.MAX_STARS, BackgroundLayer.STAR_ID, 0, true);
            this._closerStars.forEach(function (star) {
                star.scale = new Phaser.Point(1.1, 1.1);
            }, this);
        }
        BackgroundLayer.prototype.render = function (x) {
            if (this._prevX < x) {
                this._manageStars(x * 0.5);
            }
            this._prevX = x;
        };
        BackgroundLayer.prototype._manageStars = function (x) {
            var _this = this;
            this._closerStars.x = x;
            this._fartherStars.x = x;
            this._closerStars.forEachExists(function (star) {
                star.x--;
                if (star.x < (x - _this._starWidth)) {
                    star.exists = false;
                }
            }, this);
            this._fartherStars.forEachExists(function (star) {
                if (star.x < (x - _this._starWidth)) {
                    star.exists = false;
                }
            }, this);
            var screenX = x + this.game.width;
            while (this._nextFarthestStarX < screenX) {
                var starX = this._nextFarthestStarX;
                this._nextFarthestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);
                var star = this._fartherStars.getFirstExists(false);
                if (star === null) {
                    break;
                }
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }
            while (this._nextClosestStarX < screenX) {
                var starX = this._nextClosestStarX;
                this._nextClosestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);
                var star = this._closerStars.getFirstExists(false);
                if (star === null) {
                    break;
                }
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }
        };
        BackgroundLayer.MAX_STARS = 25;
        BackgroundLayer.STAR_DIST_MIN = 0;
        BackgroundLayer.STAR_DIST_MAX = 25;
        BackgroundLayer.STAR_ID = 'stars';
        return BackgroundLayer;
    }(Phaser.Group));
    PCGGame.BackgroundLayer = BackgroundLayer;
})(PCGGame || (PCGGame = {}));
var Generator;
(function (Generator) {
    ;
    var Block = (function () {
        function Block() {
            this.position = new Phaser.Point(0, 0);
            this.offset = new Phaser.Point(0, 0);
            this.type = 0;
        }
        return Block;
    }());
    Generator.Block = Block;
})(Generator || (Generator = {}));
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
    var ExperientialGameManager = (function () {
        function ExperientialGameManager() {
        }
        return ExperientialGameManager;
    }());
    PCGGame.ExperientialGameManager = ExperientialGameManager;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            _super.call(this, PCGGame.Global.SCREEN.WIDTH, PCGGame.Global.SCREEN.HEIGHT, Phaser.AUTO, 'pcg-content');
            this.state.add('Boot', PCGGame.Boot);
            this.state.add('Preload', PCGGame.Preload);
            this.state.add('Play', PCGGame.Play);
            this.state.start('Boot');
        }
        return Game;
    }(Phaser.Game));
    PCGGame.Game = Game;
})(PCGGame || (PCGGame = {}));
var Generator;
(function (Generator_1) {
    var Generator = (function () {
        function Generator(randomGenerator) {
            this._blocksQueue = new Array(Generator_1.Parameters.GRID.CELL.SIZE);
            this._blocksQueueTop = 0;
            this._hlpPoint = new Phaser.Point();
            this._randomGenerator = randomGenerator;
            this._blockPool = new Helper.Pool(Generator_1.Block, 16);
        }
        Generator.prototype._createBlock = function () {
            var block = this._blockPool.createItem();
            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }
            return block;
        };
        Object.defineProperty(Generator.prototype, "hasBlocks", {
            get: function () {
                return this._blocksQueueTop > 0;
            },
            enumerable: true,
            configurable: true
        });
        Generator.prototype.addBlockToQueue = function (block) {
            this._blocksQueue[this._blocksQueueTop++] = block;
        };
        Generator.prototype.getBlockFromQueue = function () {
            if (this._blocksQueueTop === 0) {
                return null;
            }
            var block = this._blocksQueue[0];
            for (var i = 0; i < this._blocksQueueTop - 1; i++) {
                this._blocksQueue[i] = this._blocksQueue[i + 1];
            }
            this._blocksQueue[--this._blocksQueueTop] = null;
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
            this.addBlockToQueue(block);
            return block;
        };
        Generator.prototype.generateBlocksPattern = function (lastTile, experientialGameManager) {
            var oldQueueTop = this._blocksQueueTop;
            var hlpPos = this._hlpPoint;
            hlpPos.copyFrom(lastTile);
            var length = null;
            if (this._randomGenerator.integerInRange(0, 99) < Generator_1.Parameters.PLATFORM_BLOCKS.NEW_PATTERN_COMPOSITION_PERCENTAGE) {
                length = this._randomGenerator.integerInRange(Generator_1.Parameters.PLATFORM_BLOCKS.MIN_LENGTH, Generator_1.Parameters.PLATFORM_BLOCKS.MAX_LENGTH);
            }
            var baseBlockCount = Generator_1.Parameters.PLATFORM_BLOCKS.NEW_PATTERN_REPEAT_LENGTH;
            for (var i = 0; i < baseBlockCount; i++) {
                var block = this._generate(hlpPos, length);
                hlpPos.copyFrom(block.position);
                hlpPos.x += block.length - 1;
                this.addBlockToQueue(block);
            }
            var repeat = 1;
            for (var i = 0; i < repeat; i++) {
                for (var p = 0; p < baseBlockCount; p++) {
                    var templateBlock = this._blocksQueue[oldQueueTop + p];
                    var block = this._generate(hlpPos, length, templateBlock.offset.x, templateBlock.offset.y, experientialGameManager);
                    hlpPos.copyFrom(block.position);
                    hlpPos.x += block.length - 1;
                    this.addBlockToQueue(block);
                }
            }
        };
        Generator.prototype.generateBlocksRandomly = function (lastTile, experientialGameManager) {
            var block = this._generate(lastTile);
            this.addBlockToQueue(block);
        };
        Generator.prototype.generateBlocks = function (lastTile, experientialGameManger) {
            var probability = this._randomGenerator.integerInRange(0, 99);
            if (probability < Generator_1.Parameters.GENERATE_BLOCK_THRESHOLD) {
                this.generateBlocksRandomly(lastTile, experientialGameManger);
            }
            else {
                this.generateBlocksPattern(lastTile, experientialGameManger);
            }
        };
        Generator.prototype._generate = function (lastPosition, length, offsetX, offsetY, experientialGameManger) {
            var block = this._createBlock();
            block.type = 1;
            var upperBlockBound = 0;
            var lowerBlockBound = 768 / Generator_1.Parameters.GRID.CELL.SIZE;
            var deltaGridY = lowerBlockBound - upperBlockBound;
            var minY = -5;
            var maxY = lowerBlockBound - upperBlockBound;
            var currentY = lastPosition.y - upperBlockBound;
            var shiftY = 0;
            if (typeof offsetY === 'undefined') {
                shiftY = this._randomGenerator.integerInRange(0, deltaGridY);
                shiftY -= currentY;
                shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            }
            else {
                shiftY = offsetY;
            }
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);
            block.position.y = newY + upperBlockBound;
            var shiftX = offsetX || this._randomGenerator.integerInRange(Generator_1.Parameters.PLATFORM_BLOCKS.MIN_DISTANCE, Generator_1.Parameters.PLATFORM_BLOCKS.MAX_DISTANCE);
            block.position.x = lastPosition.x + shiftX;
            block.offset.x = shiftX;
            block.length = length || this._randomGenerator.integerInRange(Generator_1.Parameters.PLATFORM_BLOCKS.MIN_LENGTH, Generator_1.Parameters.PLATFORM_BLOCKS.MAX_LENGTH);
            this._lastGeneratedBlock = block;
            return block;
        };
        return Generator;
    }());
    Generator_1.Generator = Generator;
})(Generator || (Generator = {}));
var PCGGame;
(function (PCGGame) {
    var Invader = (function (_super) {
        __extends(Invader, _super);
        function Invader(game) {
            _super.call(this, game, 0, 0, Invader.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.2);
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
            this.animations.add(Invader.ID, [0, 1, 2, 3], 20, true);
            this.play(Invader.ID);
        }
        Invader.prototype.render = function () {
            var body = this.body;
            body.velocity.x = -150;
        };
        Invader.ID = 'Invader';
        return Invader;
    }(Phaser.Sprite));
    PCGGame.Invader = Invader;
})(PCGGame || (PCGGame = {}));
var Generator;
(function (Generator) {
    var MOBGenerator = (function () {
        function MOBGenerator(randomGenerator) {
            this._blocksQueue = new Array(Generator.Parameters.GRID.CELL.SIZE);
            this._blocksQueueTop = 0;
            this._randomGenerator = randomGenerator;
            this._blockPool = new Helper.Pool(Generator.Block, 16);
        }
        MOBGenerator.prototype._createBlock = function () {
            var block = this._blockPool.createItem();
            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }
            return block;
        };
        Object.defineProperty(MOBGenerator.prototype, "hasBlocks", {
            get: function () {
                return this._blocksQueueTop > 0;
            },
            enumerable: true,
            configurable: true
        });
        MOBGenerator.prototype.addBlockToQueue = function (block) {
            this._blocksQueue[this._blocksQueueTop++] = block;
        };
        MOBGenerator.prototype.getBlockFromQueue = function () {
            if (this._blocksQueueTop === 0) {
                return null;
            }
            var block = this._blocksQueue[0];
            for (var i = 0; i < this._blocksQueueTop - 1; i++) {
                this._blocksQueue[i] = this._blocksQueue[i + 1];
            }
            this._blocksQueue[--this._blocksQueueTop] = null;
            return block;
        };
        MOBGenerator.prototype.destroyBlock = function (block) {
            this._blockPool.destroyItem(block);
        };
        MOBGenerator.prototype.addMob = function (x, y, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = 1;
            this.addBlockToQueue(block);
            return block;
        };
        MOBGenerator.prototype.generateMOBs = function (lastTile, experientialGameManger) {
            var block = this._generate(lastTile);
            this.addBlockToQueue(block);
        };
        MOBGenerator.prototype._generate = function (lastPosition, length, offsetX, offsetY, experientialGameManger) {
            var block = this._createBlock();
            block.type = this._randomGenerator.integerInRange(2, 4);
            var upperBlockBound = 0;
            var lowerBlockBound = 768 / Generator.Parameters.GRID.CELL.SIZE;
            var deltaGridY = lowerBlockBound - upperBlockBound;
            var minY = -5;
            var maxY = lowerBlockBound - upperBlockBound;
            var currentY = lastPosition.y - upperBlockBound;
            var shiftY = 0;
            if (typeof offsetY === 'undefined') {
                shiftY = this._randomGenerator.integerInRange(0, deltaGridY);
                shiftY -= currentY;
                shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            }
            else {
                shiftY = offsetY;
            }
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);
            block.position.y = newY + upperBlockBound;
            var shiftX = offsetX || this._randomGenerator.integerInRange(Generator.Parameters.PLATFORM_BLOCKS.MIN_DISTANCE, Generator.Parameters.PLATFORM_BLOCKS.MAX_DISTANCE);
            block.position.x = lastPosition.x + shiftX;
            block.offset.x = shiftX;
            block.length = 1;
            this._lastGeneratedBlock = block;
            return block;
        };
        return MOBGenerator;
    }());
    Generator.MOBGenerator = MOBGenerator;
})(Generator || (Generator = {}));
var PCGGame;
(function (PCGGame) {
    ;
    var MainLayer = (function (_super) {
        __extends(MainLayer, _super);
        function MainLayer(game, parent) {
            var _this = this;
            _super.call(this, game, parent);
            this._lastTile = new Phaser.Point(0, 0);
            this._lastMOB = new Phaser.Point(0, 0);
            this._game = game;
            this._randomGenerator = game.rnd;
            this._generator = new Generator.Generator(this._randomGenerator);
            this._MOBgenerator = new Generator.MOBGenerator(this._randomGenerator);
            this._MOBSpritePool = new Helper.Pool(Phaser.Sprite, Generator.Parameters.GRID.CELL.SIZE / 2, function () {
                var sprite = new Phaser.Sprite(game, 0, 0);
                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                var body = sprite.body;
                body.allowGravity = false;
                body.immovable = false;
                body.moves = true;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                return sprite;
            });
            this._wallSpritePool = new Helper.Pool(Phaser.Sprite, Generator.Parameters.GRID.CELL.SIZE / 2, function () {
                var sprite = new Phaser.Sprite(game, 0, 0, 'BlockTextures', 0);
                _this._changeSpriteBlockTexture(sprite);
                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                var body = sprite.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                return sprite;
            });
            this._walls = new Phaser.Group(game, this);
            this._mobs = new Phaser.Group(game, this);
            this._generator.addBlock(0, this._randomGenerator.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), this._randomGenerator.integerInRange(1, 3));
            this._MOBgenerator.addMob(0, this._randomGenerator.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), this._randomGenerator.integerInRange(1, 3));
            this._platformGenerationState = 0;
            this._mobsGenerationState = 0;
        }
        MainLayer.prototype.render = function () {
        };
        Object.defineProperty(MainLayer.prototype, "wallBlocks", {
            get: function () {
                return this._walls;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MainLayer.prototype, "mobs", {
            get: function () {
                return this._mobs;
            },
            enumerable: true,
            configurable: true
        });
        MainLayer.prototype.generate = function (leftTile) {
            this._cleanTiles(leftTile);
            this._cleanMOBS(leftTile);
            var width = Math.ceil(this.game.width / Generator.Parameters.GRID.CELL.SIZE);
            while (this._lastTile.x < leftTile + width) {
                switch (this._platformGenerationState) {
                    case 0:
                        if (!this._generator.hasBlocks) {
                            console.error("Blocks queue is empty!");
                        }
                        var block = this._generator.getBlockFromQueue();
                        this._lastTile.copyFrom(block.position);
                        var length_1 = block.length;
                        while (length_1 > 0) {
                            this._addSpriteBlock(this._lastTile.x, this._lastTile.y);
                            if ((--length_1) > 0) {
                                ++this._lastTile.x;
                            }
                        }
                        this._generator.destroyBlock(block);
                        if (!this._generator.hasBlocks) {
                            this._platformGenerationState = 1;
                        }
                        break;
                    case 1:
                        this._generator.generateBlocks(this._lastTile);
                        this._platformGenerationState = 0;
                        break;
                }
            }
            while (this._lastMOB.x < leftTile + width) {
                switch (this._mobsGenerationState) {
                    case 0:
                        if (!this._MOBgenerator.hasBlocks) {
                            console.error("Mob Blocks queue is empty!");
                        }
                        var block = this._MOBgenerator.getBlockFromQueue();
                        this._lastMOB.copyFrom(block.position);
                        var length_2 = block.length;
                        while (length_2 > 0) {
                            this._addMobSprite(this._lastMOB.x, this._lastMOB.y, block.type);
                            if ((--length_2) > 0) {
                                ++this._lastMOB.x;
                            }
                        }
                        this._MOBgenerator.destroyBlock(block);
                        if (!this._MOBgenerator.hasBlocks) {
                            this._mobsGenerationState = 1;
                        }
                        break;
                    case 1:
                        this._MOBgenerator.generateMOBs(this._lastMOB);
                        this._mobsGenerationState = 0;
                        break;
                }
            }
        };
        MainLayer.prototype._cleanMOBS = function (leftTile) {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (var i = this._mobs.length - 1; i >= 0; i--) {
                var wall = this._mobs.getChildAt(i);
                if ((wall.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._mobs.remove(wall);
                    wall.parent = null;
                    this._MOBSpritePool.destroyItem(wall);
                }
            }
        };
        MainLayer.prototype._cleanTiles = function (leftTile) {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (var i = this._walls.length - 1; i >= 0; i--) {
                var wall = this._walls.getChildAt(i);
                if ((wall.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallSpritePool.destroyItem(wall);
                }
            }
        };
        MainLayer.prototype._changeSpriteBlockTexture = function (sprite) {
            sprite.frame = this._randomGenerator.integerInRange(0, Generator.Parameters.SPRITE.FRAMES - 1);
        };
        MainLayer.prototype._addSpriteBlock = function (x, y) {
            var sprite = this._wallSpritePool.createItem();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            sprite.exists = true;
            sprite.visible = true;
            this._changeSpriteBlockTexture(sprite);
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        };
        MainLayer.prototype._addMobSprite = function (x, y, mobType) {
            var oldSprite = this._MOBSpritePool.createItem();
            var sprite = null;
            switch (mobType) {
                case 4:
                    sprite = new PCGGame.Notch(this._game);
                    break;
                case 3:
                    sprite = new PCGGame.Invader(this._game);
                    break;
                default:
                    sprite = new PCGGame.Meteor(this._game);
                    break;
            }
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            sprite.exists = true;
            sprite.visible = true;
            if (sprite.parent === null) {
                this._mobs.add(sprite);
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
            _super.call(this, game, 0, 0, Meteor.ID);
            this._velocityX = -50;
            this._velocityY = 0;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.2);
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
        }
        Meteor.prototype.render = function () {
            var body = this.body;
            body.velocity.x = this._velocityX;
            body.velocity.y = this._velocityY;
        };
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
            _super.call(this, game, 0, 0, Notch.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.5);
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
            this.animations.add(Notch.ID, [0, 1, 2, 3, 4, 5], 20, true);
            this.play(Notch.ID);
        }
        Notch.prototype.render = function () {
            var body = this.body;
            body.velocity.x = -10;
        };
        Notch.ID = 'Notch';
        return Notch;
    }(Phaser.Sprite));
    PCGGame.Notch = Notch;
})(PCGGame || (PCGGame = {}));
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
        Parameters.SPRITE = {
            WIDTH: 32,
            HEIGHT: 32,
            FRAMES: 10
        };
        Parameters.PLAYER = {
            BODY: {
                WIDTH: 32,
                HEIGHT: 32
            }
        };
        Parameters.GENERATE_BLOCK_THRESHOLD = 50;
        Parameters.PLATFORM_BLOCKS = {
            MIN_LENGTH: 1,
            MAX_LENGTH: 5,
            MIN_DISTANCE: 1,
            MAX_DISTANCE: 10,
            NEW_PATTERN_REPEAT_LENGTH: 2,
            NEW_PATTERN_COMPOSITION_PERCENTAGE: 80
        };
        Parameters.VELOCITY = {
            X: 300
        };
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
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
            this.game.time.advancedTiming = true;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;
            this._animation = PCGGame.Animation.instance(this.game, this.world);
            this._player = new PCGGame.Player(this.game);
            this._player.position.set(Generator.Parameters.GRID.CELL.SIZE, (PCGGame.Global.SCREEN.HEIGHT - Generator.Parameters.PLAYER.BODY.HEIGHT) / 2);
            this._backgroundLayer = new PCGGame.BackgroundLayer(this.game, this.world);
            this._mainLayer = new PCGGame.MainLayer(this.game, this.world);
            this.world.add(this._player);
            this._fireKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this._fireKey.onDown.add(function () {
                _this._keysPressed.fire = true;
                console.log('Space Fire Key Down!');
            }, this);
            this._fireKey.onUp.add(function () {
                _this._keysPressed.fire = false;
                console.log('Space Fire Key Up!');
            }, this);
            this.game.input.onDown.add(function () {
                _this._keysPressed.fire = true;
                console.log('Mouse Fire Key Down!');
            }, this);
            this.game.input.onUp.add(function () {
                _this._keysPressed.fire = false;
                console.log('Mouse Fire Key Up!');
            }, this);
            this._cursors = this.game.input.keyboard.createCursorKeys();
            this.game.input.addMoveCallback(function (pointer, x, y) {
                _this._player.position.y = y;
            }, this);
        };
        Play.prototype.render = function () {
            this._mainLayer.render();
        };
        Play.prototype.update = function () {
            if (this._gameState.end || this._gameState.paused) {
                return;
            }
            this.updatePhysics();
            this.game.debug.text((this.game.time.fps.toString() || '--') + 'fps', 2, 14, "#00ff00");
            this.camera.x = this._player.x - Generator.Parameters.GRID.CELL.SIZE * 1.5;
            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE);
            this._backgroundLayer.render(this.camera.x);
        };
        Play.prototype.wallBulletCollisionHandler = function (bullet, wall) {
            bullet.kill();
        };
        Play.prototype.mobBulletCollisionHandler = function (bullet, mob) {
            bullet.kill();
            mob.kill();
        };
        Play.prototype.updatePhysics = function () {
            var playerBody = this._player.body;
            var wallBlockCollision = this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.wallBlocks, this.wallBulletCollisionHandler, null, this);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.mobs, this.mobBulletCollisionHandler, null, this);
            if (wallBlockCollision) {
                this._player.die();
                return;
            }
            this._mainLayer.mobs.forEachExists(function (mob) { mob.render(); }, this);
            if (playerBody.velocity.x < 1) {
                playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            }
            if (this._keysPressed.fire) {
                this._player.fire();
            }
            if (this._cursors.left.isDown) {
                this._player.slowDown();
            }
            else if (this._cursors.right.isDown) {
                this._player.speedUp();
            }
            if (this._cursors.up.isDown) {
                this._player.position.y = Math.max(playerBody.halfHeight, this._player.position.y - 5);
            }
            else if (this._cursors.down.isDown) {
                this._player.position.y = Math.min(PCGGame.Global.SCREEN.HEIGHT - playerBody.halfHeight, this._player.position.y + 5);
            }
        };
        return Play;
    }(Phaser.State));
    PCGGame.Play = Play;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(game) {
            _super.call(this, game, 0, 0, Player.ID);
            this._isDead = false;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.2);
            this._weapon = game.add.weapon(Player.NUM_BULLETS, Player.BULLET_ID);
            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width * 4;
            this._weapon.bulletAngleOffset = 0;
            this._weapon.fireAngle = Phaser.ANGLE_RIGHT;
            this._weapon.fireRate = 80;
            this._weapon.bulletSpeedVariance = 10;
            this._weapon.trackSprite(this, 16, 0);
            game.physics.arcade.enable(this, false);
            this._body = this.body;
            this._body.allowGravity = false;
            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
        }
        Player.prototype._updateBulletSpeed = function (speed) {
            var playerBody = this._body;
            this._weapon.bulletSpeed = (speed || playerBody.velocity.x) + 200;
        };
        Player.prototype.speedUp = function () {
            var playerBody = this._body;
            playerBody.velocity.x = Math.max(playerBody.velocity.x + Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
            this._updateBulletSpeed();
        };
        Player.prototype.slowDown = function () {
            var playerBody = this._body;
            playerBody.velocity.x = Math.max(playerBody.velocity.x - Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
            this._updateBulletSpeed();
        };
        Player.prototype.fire = function () {
            this._weapon.fire();
        };
        Object.defineProperty(Player.prototype, "died", {
            get: function () {
                return this._isDead;
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.die = function () {
            var _this = this;
            if (this.died) {
                return;
            }
            this._isDead = true;
            this.loadTexture(PCGGame.Animation.EXPLODE_ID);
            this.animations.add(PCGGame.Animation.EXPLODE_ID, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);
            this.play(PCGGame.Animation.EXPLODE_ID, false);
            this.animations.currentAnim.onComplete.add(function () {
                _this._isDead = false;
                _this.loadTexture(Player.ID);
            }, this);
            var playerBody = this._body;
            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
            playerBody.velocity.set(0, 0);
        };
        Object.defineProperty(Player.prototype, "bullets", {
            get: function () {
                return this._weapon.bullets;
            },
            enumerable: true,
            configurable: true
        });
        Player.ID = 'Player';
        Player.BULLET_ID = 'Player.Bullet';
        Player.VELOCITY_INC = 5;
        Player.NUM_BULLETS = 100;
        return Player;
    }(Phaser.Sprite));
    PCGGame.Player = Player;
})(PCGGame || (PCGGame = {}));
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
                this._pool.push(this.newItem());
                this._itemCount++;
            }
        }
        Pool.prototype.createItem = function () {
            if (this._itemCount === 0) {
                return this._canGrow ? this.newItem() : null;
            }
            else {
                return this._pool[--this._itemCount];
            }
        };
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
    var Preload = (function (_super) {
        __extends(Preload, _super);
        function Preload() {
            _super.apply(this, arguments);
            this._isGameReady = false;
        }
        Preload.prototype.create = function () {
        };
        Preload.prototype.preload = function () {
            this.load.spritesheet('BlockTextures', 'assets/grid-tiles.png', Generator.Parameters.SPRITE.WIDTH, Generator.Parameters.SPRITE.HEIGHT, Generator.Parameters.SPRITE.FRAMES);
            this.load.spritesheet(PCGGame.Animation.EXPLODE_ID, 'assets/explode.png', 128, 128, 16);
            this.load.spritesheet(PCGGame.Notch.ID, 'assets/tutor-anim.png', 32, 32, 6);
            this.load.spritesheet(PCGGame.Invader.ID, 'assets/invader32x32x4.png', 32, 32, 4);
            this.load.image(PCGGame.Player.ID, 'assets/ship.png');
            this.load.image(PCGGame.Player.BULLET_ID, 'assets/player-bullet.png');
            this.load.image(PCGGame.Meteor.ID, 'assets/meteor.png');
            this.load.image(PCGGame.BackgroundLayer.STAR_ID, 'assets/star.png');
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