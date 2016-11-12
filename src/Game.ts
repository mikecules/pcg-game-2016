namespace PCGGame {
    export class Game extends Phaser.Game {

        public constructor() {
            // initialize the game
            super(Global.SCREEN.WIDTH, Global.SCREEN.HEIGHT, Phaser.AUTO, 'pcg-content');
        }
    }
}