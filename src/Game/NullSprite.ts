/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class NullSprite extends Sprite {

        public static ID : string = 'null';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.frame = 0;

            this._killScoreVal = 20;

            // enable physics for player
            game.physics.arcade.enable(this, false);

        }


        public getDamageCost() {
            return this.weaponDamageCost;
        }

        public reset() {
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            super.reset();
            this.canCollide = false;
            body.allowGravity = false;
            body.immovable = true;
            body.moves = false;
            this.dangerLevel = spriteDangerLevelEnum.NO_DANGER;

        }
    }

}