/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class PushPlatform extends Sprite {

        public static ID : string = 'PlatformBlock';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Platform.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.frame = 11;

            this._killScoreVal = 20;

            // enable physics for player
            game.physics.arcade.enable(this, false);
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
            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.setSize(32, 32 , -3, 0);

            this.frame = 11;
            body.allowGravity = false;
            body.immovable = false;
            body.moves = true;
            this.health = this.weaponDamageCost * 3;
            this.dangerLevel = spriteDangerLevelEnum.LOW_DANGER;


        }
    }

}