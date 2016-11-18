/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class Platform extends Sprite {

        public static ID : string = 'PlatformBlock';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Platform.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.frame = 0;

            this._killScoreVal = 20;

            // enable physics for player
            game.physics.arcade.enable(this, false);


            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;
            body.immovable = false;
            body.moves = true;


        }

        public render(player : Player) {

            super.render(player);

            if (this.died) {
                return;
            }

        }

        public getDamageCost() {
            return this.weaponDamageCost;
        }

        public reset() {
            super.reset();
            this.health = this.weaponDamageCost * 2;
            this.dangerLevel = spriteDangerLevelEnum.LOW_DANGER;

        }
    }

}