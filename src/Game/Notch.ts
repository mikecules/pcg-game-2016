/// <reference path="Sprite.ts" />

namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;
    export class Notch extends Sprite {

        public static ID : string = 'Notch';

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Notch.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.5);

            this._killScoreVal = 250;

            this.mobType = blockTypeEnum.MOB_NOTCH;

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;

        }

        public render(player : Player) {

            super.render(player);

            if (this.died) {
                return;
            }

            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.velocity.x = -10;
        }

        public getDamageCost() {
            return -5;
        }

        public reset() {
            super.reset();
            this.health = this.weaponDamageCost;

            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.setCircle(20, -5 , -5);
            body.immovable = true;

            this.dangerLevel = spriteDangerLevelEnum.NO_DANGER;
            this.animations.add(Notch.ID, [ 0, 1, 2, 3, 4, 5], 20, true);
            this.play(Notch.ID);
        }
    }

}