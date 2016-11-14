namespace PCGGame {
    export class Preload extends Phaser.State {

        private _isGameReady : boolean = false;

        public create() {
        }

        public preload() {

            this.load.spritesheet('BlockTextures', 'assets/grid-tiles.png', Generator.Parameters.SPRITE.WIDTH, Generator.Parameters.SPRITE.HEIGHT, Generator.Parameters.SPRITE.FRAMES);
            this.load.image(Player.ID, 'assets/ship.png');

        }

        public update() {

            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        }
    }
}