namespace PCGGame {
    export class Preload extends Phaser.State {

        private _isGameReady : boolean = false;

        public create() {
        }

        public preload() {

        }

        public update() {

            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        }
    }
}