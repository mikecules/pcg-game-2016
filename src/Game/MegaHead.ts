/// <reference path="Sprite.ts" />

namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;

    export class MegaHead extends Sprite {

        public static ID : string = 'MegaHead';
        public static BULLET_ID : string = 'Invader.Bullets';
        public static NUM_BULLETS : number = 60;


        public static WEAPON_STATS : any = {
            fireRate: 400,
            variance: 0,
            bulletAngleVariance: 0
        };


        public constructor(game : Phaser.Game) {

            super(game, 0, 0, MegaHead.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.5);

            this._killScoreVal = 1000;

            this.mobType = blockTypeEnum.MOB_MEGA_HEAD;

            this._weapon = game.add.weapon(MegaHead.NUM_BULLETS, MegaHead.BULLET_ID);

            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width * 2;




            //  Because our bullet is drawn facing up, we need to offset its rotation:
            this._weapon.bulletAngleOffset = 0;

            this._weapon.bulletAngleVariance = MegaHead.WEAPON_STATS.bulletAngleVariance;

            this._weapon.fireAngle = Phaser.ANGLE_LEFT;


            //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 80ms
            this._weapon.fireRate = MegaHead.WEAPON_STATS.fireRate; //80;

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = MegaHead.WEAPON_STATS.variance; //10;

            this._weapon.trackSprite(this, 16, 0);

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

            this.game.physics.arcade.moveToObject(this, player, 1500, 3000);
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

            let body : Phaser.Physics.Arcade.Body = <Phaser.Physics.Arcade.Body>this.body;
            body.setSize(78, 92);
            body.immovable = false;
            this.health = Math.min(100, 2 * (this.weaponDamageCost + (this.weaponDamageCost * this.difficultyLevel)));
            this.upgradeWeapon();
            this.dangerLevel = spriteDangerLevelEnum.HIGH_DANGER;
            this.aggressionProbability = 70;
            this.animations.add(MegaHead.ID, [0, 1, 2, 3], 1, true);
            this.play(MegaHead.ID);
        }


    }

}