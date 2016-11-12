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
            this.stage.backgroundColor = 0x80FF80;
            Generator.JumpTables.setDebug(true, PCGGame.Global);
            this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
        };
        Play.prototype.update = function () {
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
var Generator;
(function (Generator) {
    var Parameters = (function () {
        function Parameters() {
        }
        Parameters.GRID = {
            HEIGHT: 10,
            CELL: {
                SIZE: 64,
                STEPS: 4
            }
        };
        Parameters.GRAVITY = 2400;
        Parameters.PLAYER = {
            BODY: {
                WIDTH: 30,
                HEIGHT: 90
            }
        };
        Parameters.JUMP = {
            HEIGHT: {
                MIN: Parameters.GRID.CELL.SIZE * 0.75,
                MAX: Parameters.GRID.CELL.SIZE * 2.90,
                STEPS: Parameters.GRID.STEPS
            }
        };
        Parameters.VELOCITY = {
            X: 300
        };
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var JumpTables = (function () {
        function JumpTables() {
            this._jumpVelocityImpulseLookup = [];
            this.calcJumpVelocityImpulses();
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
        };
        Object.defineProperty(JumpTables.prototype, "minJumpVelocityImpulse", {
            get: function () {
                return this._jumpVelocityImpulseLookup[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JumpTables.prototype, "maxJumpVelocityImpulse", {
            get: function () {
                return this._jumpVelocityImpulseLookup[Generator.Parameters.JUMP.HEIGHT.STEPS - 1];
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
            for (var j = 0; j < gameConf.SCREEN.WIDTH; j += Generator.Parameters.GRID.CELL.SIZE) {
                bitMapData.line(j + 0.5, 0, j + 0.5, gameConf.SCREEN.HEIGHT - 1);
                bitMapData.text((j / Generator.Parameters.GRID.CELL.SIZE).toString(), j + 20, 20, '16px Courier', '#00ff00');
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
        JumpTables._instance = null;
        JumpTables._debug = false;
        return JumpTables;
    }());
    Generator.JumpTables = JumpTables;
})(Generator || (Generator = {}));
//# sourceMappingURL=app.js.map