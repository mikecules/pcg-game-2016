namespace PCGGame {
    export class Preload extends Phaser.State {

        private _isGameReady : boolean = false;

        public create() {
        }

        public preload() {

            this.load.image('gridTiles', 'assets/grid-tiles.png');
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