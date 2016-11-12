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
//# sourceMappingURL=app.js.map