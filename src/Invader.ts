namespace PCGGame {

    export class Invader extends Phaser.Sprite {

        public static ID : string = 'Invader';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Player.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;
        }
    }

}