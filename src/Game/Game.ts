/// <reference path="Sprite.ts" />
/// <reference path="../../lib/phaser.d.ts" />
/// <reference path="../../lib/pixi.d.ts" />
/// <reference path="../../lib/p2.d.ts" />

namespace PCGGame {
    export class Game extends Phaser.Game {

        public constructor() {
            // initialize the game
            super(Global.SCREEN.WIDTH, Global.SCREEN.HEIGHT, Phaser.AUTO, 'pcg-content');
            //super(Global.SCREEN.WIDTH, Global.SCREEN.HEIGHT, Phaser.CANVAS, 'pcg-content');

            // add states to state manager
            this.state.add('Boot', Boot);
            this.state.add('Preload', Preload);
            this.state.add('Play', Play);

            // begin game execution
            this.state.start('Boot');
        }


    }
}