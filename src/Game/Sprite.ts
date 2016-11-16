namespace PCGGame {

    export const enum spriteDangerLevelEnum {NO_DANGER, LOW_DANGER, MEDIUM_DANGER}

    export class Sprite extends Phaser.Sprite {

        public static LOOT_ID : string = 'mob.loot';

        public spriteFactoryParent : SpriteSingletonFactory = null;
        public canCollide : boolean = true;
        public dangerLevel : number = spriteDangerLevelEnum.NO_DANGER;

        protected _isInvincible : boolean = false;
        protected _id : string = null;
        protected _isDead : boolean = false;
        protected _weapon : Phaser.Weapon;
        protected _loot : Loot = null;


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

        public render(player? : Player) {
            console.log('Base Sprite class die.');
        }

        public fire(player? : Player) {
            console.log('Base class fire.');
        }

        public die(player : Player) {

            if (this._isDead) {
                return;
            }

            console.log('Base Sprite class die.');

            this._isDead = true;

            this.loadTexture(Animation.EXPLODE_ID);
            this.animations.add(Animation.EXPLODE_ID, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);

            this._generateLoot();
            this.play(Animation.EXPLODE_ID, 30, false);

            this.animations.currentAnim.onComplete.add(() => {
                this._convertMobToLoot(player);

               /*
                    this.exists = false;
                    setTimeout(this.kill, 1000);
                */


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
            this._loot.type = this.game.rnd.integerInRange(lootTypeEnum.DEFAULT, lootTypeEnum.NEW_LIFE);
        }

        protected _convertMobToLoot(player: Player) {
            this.loadTexture(Sprite.LOOT_ID);
            this.game.physics.arcade.moveToObject(this, player, 1000, 3500);
            this.alpha = 1;
            this.tint = this._loot.spriteTint;
        }

        public getDamageCost() : number {
            return 10;
        }

        public reset() : Sprite {
            //super.reset(0, 0);
            this._isDead = false;
            this._loot = null;
            this.health = 100;
            this.alpha = 1;
            this.tint = 0xffffff;
            this.dangerLevel = spriteDangerLevelEnum.NO_DANGER;
            this.canCollide = true;
            this.loadTexture(this._id);
            return this;
        }


        public tweenSpriteTint(obj : Phaser.Sprite, startColor : number, endColor : number, time : number = 250, callback : Function = null) {
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
    }
}

