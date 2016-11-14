namespace PCGGame {
    export class Preload extends Phaser.State {

        private _isGameReady : boolean = false;

        public create() {
        }

        public preload() {

            this.load.spritesheet('BlockTextures', 'assets/grid-tiles.png', Generator.Parameters.SPRITE.WIDTH, Generator.Parameters.SPRITE.HEIGHT, Generator.Parameters.SPRITE.FRAMES);
            this.load.spritesheet(Animation.EXPLODE_ID, 'assets/explode.png', 128, 128, 16);
            this.load.spritesheet(Notch.ID, 'assets/tutor-anim.png', 32, 32, 6);
            this.load.spritesheet(Invader.ID, 'assets/invader32x32x4.png', 32, 32, 4);

            this.load.image(Player.ID, 'assets/ship.png');
            this.load.image(Player.BULLET_ID, 'assets/player-bullet.png');
            this.load.image(Meteor.ID, 'assets/meteor.png');
            this.load.image(BackgroundLayer.STAR_ID, 'assets/star.png');

        }

        public update() {

            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        }
    }
}