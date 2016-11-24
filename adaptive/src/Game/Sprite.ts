namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;
    export const enum spriteDangerLevelEnum {NO_DANGER, LOW_DANGER, MEDIUM_DANGER, HIGH_DANGER}

    export class Sprite extends Phaser.Sprite {

        public static LOOT_ID : string = 'mob.loot';

        public mobType : number = blockTypeEnum.MOB_NULL;

        public spriteFactoryParent : SpriteSingletonFactory = null;
        public canCollide : boolean = true;
        public dangerLevel : number = spriteDangerLevelEnum.NO_DANGER;
        public weaponDamageCost : number = 10;
        public aggressionProbability : number = 0;
        public difficultyLevel : number = 0;

        protected _isInvincible : boolean = false;
        protected _id : string = null;
        protected _isDead : boolean = false;
        protected _weapon : Phaser.Weapon = null;
        protected _loot : Loot = null;
        protected _killScoreVal : number = 10;




        public constructor(game : Phaser.Game, x?: number, y?: number, id? : string) {
            super(game, x, y, id);
            this._id = id;
            this.health = 100;
        }

        public get isInvincible() : boolean {
            return this._isInvincible;
        }

        public set isInvincible(isInvincibleFlag : boolean) {
            this._isInvincible = isInvincibleFlag;
        }

        public render(player : Player) {
            //console.log('Base Sprite class die.');

            if (this._isDead && this.hasLoot) {
                this.angle = (this.angle - 1) % 360;
                //this.game.physics.arcade.moveToObject(this, player, 1000, 800);
                this.game.physics.arcade.moveToObject(this, player, 1000, 800);
            }
        }

        public fire(player? : Player) {
            //console.log('Base class fire.');
        }

        public die(player : Player) {

            if (this._isDead) {
                return;
            }

            //console.log('Base Sprite class die.');

            this._isDead = true;

            this.loadTexture(Animation.EXPLODE_ID);
            this.animations.add(Animation.EXPLODE_ID, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);


            this.play(Animation.EXPLODE_ID, 30, false);

            this.animations.currentAnim.onComplete.add(() => {
                this._generateLoot();
                this._convertMobToLoot();
            }, this);
        }

        public get died() : boolean {
            return this._isDead;
        }

        public get hasLoot() : boolean {
            return this._loot !== null;
        }

        public getLoot() : Loot {
            return this._loot;
        }

        protected _generateLoot() {
            console.log('Base Sprite get loot!');
            this._loot = new Loot();
        }

        protected _convertMobToLoot() {
            this.loadTexture(Sprite.LOOT_ID);

            if (typeof this.body !== 'undefined') {
                this.body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                this.body.immovable = true;
            }

            this.alpha = 1;
            this.tint = this._loot.spriteTint;
        }

        public getDamageCost() : number {
            return this.weaponDamageCost;
        }

        public reset(x : number = 0, y : number = 0, health? : number)  {
            super.reset(x, y);
            this._isDead = false;
            this.angle = 0;
            this._loot = null;
            this.health = 100;
            this.alpha = 1;
            this.tint = 0xffffff;
            this.dangerLevel = spriteDangerLevelEnum.NO_DANGER;
            this.canCollide = true;
            this.aggressionProbability = 0;
            this.loadTexture(this._id);
        }

        public getKillScore() : number {
            return this._killScoreVal;
        }


        public tweenSpriteTint(obj : Sprite, startColor : number, endColor : number, time : number = 250, callback : Function = null) {
            if (obj) {

                let colorBlend = { step: 0 };
                let colorTween = this.game.add.tween(colorBlend).to({ step: 100 }, time);

                colorTween.onUpdateCallback(() => {
                    obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
                });

                obj.tint = startColor;

                if (callback) {
                    colorTween.onComplete.add(() => {
                        callback();
                    });
                }

                colorTween.start();
            }
        }

        public takeDamage(damage : number) {

            this.health -= damage;

            this.tweenSpriteTint(this, 0xff00ff, 0xffffff, 500);

        }

        public get bullets() : Phaser.Group {
            let bullets : Phaser.Group = null;

            if (this._weapon !== null) {
                bullets = this._weapon.bullets;
            }

            return bullets;
        }

        public upgradeWeapon() {
            if (! this._weapon ) {
                return;
            }

            this._weapon.fireRate = Math.max(this._weapon.fireRate - (this.difficultyLevel * 100), 200);

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = Math.min(this._weapon.bulletSpeedVariance + this.difficultyLevel, Player.MAX_WEAPON_STATS.variance);

        }
    }
}

