/// <reference path="Sprite.ts" />
namespace PCGGame {

    export class Invader extends Sprite {

        public static ID : string = 'Invader';
        public static BULLET_ID : string = 'Invader.Bullets';
        public static NUM_BULLETS : number = 20;

        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Invader.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.2);

            this._killScoreVal = 500;

            // enable physics for player
            game.physics.arcade.enable(this, false);

            this.health = this.weaponDamageCost;

            // allow gravity
            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;

            body.allowGravity = false;


            this._weapon = game.add.weapon(Invader.NUM_BULLETS, Invader.BULLET_ID);

            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width;


            //  Because our bullet is drawn facing up, we need to offset its rotation:
            this._weapon.bulletAngleOffset = 0;

            this._weapon.fireAngle = Phaser.ANGLE_LEFT;



            //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
            this._weapon.fireRate = 1500;

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = 0;

            this._weapon.trackSprite(this, 16, 0);

        }

        public render(player:Player) {

            super.render(player);

            if (this.died) {
                return;
            }

            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.velocity.x = -150;


            let shouldFight = this.game.rnd.integerInRange(0, 100);
            let AGGRESSION_LEVEL = 50;

            if (shouldFight > AGGRESSION_LEVEL) {
                this.fire(player);
            }
        }

        public fire(player:Player) {

            this._weapon.fire();

            this._weapon.bullets.forEachExists((bullet: Phaser.Sprite) => {
                // speed, max time
                this.game.physics.arcade.moveToObject(bullet, player, 1500, 500);

            }, this);

        }

        public reset() {
            super.reset();
            this.health = this.weaponDamageCost;
            this.dangerLevel = spriteDangerLevelEnum.MEDIUM_DANGER;
            this.animations.add(Invader.ID, [ 0, 1, 2, 3 ], 20, true);
            this.play(Invader.ID);
        }

    }

}