/// <reference path="Sprite.ts" />

namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;

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

            this._killScoreVal = 200;

            this.mobType = blockTypeEnum.MOB_METEOR;

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

           let body: Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
           body.velocity.x = this._velocityX;
           body.velocity.y = this._velocityY;

           this.angle = (this.angle - 1) % 360;

        }

        public reset() {
            super.reset();
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.setCircle(20, -5 , -5);
            body.immovable = true;
            this.health = this.weaponDamageCost + this.difficultyLevel * 10;
            this.dangerLevel = spriteDangerLevelEnum.LOW_DANGER;
        }
    }

}