namespace PCGGame {
    export class Preload extends Phaser.State {

        private _isGameReady : boolean = false;

        public create() {
        }

        public preload() {

            this.load.spritesheet(Platform.ID, 'assets/grid-tiles.png', Generator.Parameters.SPRITE.WIDTH, Generator.Parameters.SPRITE.HEIGHT, Generator.Parameters.SPRITE.FRAMES);
            this.load.spritesheet(Animation.EXPLODE_ID, 'assets/explode.png', 128, 128, 16);
            this.load.spritesheet(Notch.ID, 'assets/tutor-anim.png', 32, 32, 6);
            this.load.spritesheet(Invader.ID, 'assets/invader32x32x4.png', 32, 32, 4);
            this.load.spritesheet(MegaHead.ID, 'assets/metalface78x92.png', 78, 92, 4);
            this.load.spritesheet(Player.BULLET_ID, 'assets/rgb-bullets.png', 8, 4, Player.NUM_BULLET_FRAMES);

            this.load.image(Player.ID, 'assets/ship.png');
            this.load.image(Play.SHIELD_ID, 'assets/shield.png');
            this.load.image(Sprite.LOOT_ID, 'assets/star-particle.png');
            this.load.image(Invader.BULLET_ID, 'assets/enemy-bullet.png');
            this.load.image(Meteor.ID, 'assets/meteor.png');
            this.load.image(BackgroundLayer.STAR_ID, 'assets/star.png');


            // Source: http://soundimage.org/
            this.load.audio(Play.MUSIC_ID, ['assets/game-music.mp3', 'assets/game-music.ogg'])

        }

        public update() {

            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        }
    }
}