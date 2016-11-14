namespace PCGGame {

    export class Invader extends Phaser.Sprite {

        public static ID : string = 'Invader';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Invader.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.2);

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;

            this.animations.add(Invader.ID, [ 0, 1, 2, 3 ], 20, true);
            this.play(Invader.ID);
        }

        public render() {
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.velocity.x = -150;
        }
    }

}