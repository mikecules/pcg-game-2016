/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class Meteor extends Sprite {

        public static ID : string = 'Meteor';

        private _velocityX = -50;
        private _velocityY = 0;

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Meteor.ID);

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
        }

        public render() {

            if (this.died) {
                return;
            }

           let body: Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
           body.velocity.x = this._velocityX;
           body.velocity.y = this._velocityY;

           this.angle += -1;

        }

        public reset() {
            super.reset();
            this.dangerLevel = spriteDangerLevelEnum.LOW_DANGER;
        }
    }

}