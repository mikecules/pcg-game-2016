/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class Notch extends Sprite {

        public static ID : string = 'Notch';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Notch.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.5);

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;

        }

        public render() {

            if (this.died) {
                return;
            }

            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.velocity.x = -10;
        }

        public reset() {
            super.reset();
            this.dangerLevel = spriteDangerLevelEnum.NO_DANGER;
            this.animations.add(Notch.ID, [ 0, 1, 2, 3, 4, 5], 20, true);
            this.play(Notch.ID);
        }
    }

}