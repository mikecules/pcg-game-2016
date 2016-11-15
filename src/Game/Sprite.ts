namespace PCGGame {
    export class Sprite extends Phaser.Sprite {

        public spriteFactoryParent : SpriteSingletonFactory = null;

        protected _id : string = null;
        protected _isDead : boolean = false;
        protected _weapon : Phaser.Weapon;


        public constructor(game : Phaser.Game, x?: number, y?: number, id? : string) {
            super(game, x, y, id);
            this._id = id;
        }

        public render() {
            console.log('Base Sprite class die.');
        }

        public fire() {
            console.log('Base class fire.');
        }

        public die() {

            if (this._isDead) {
                return;
            }

            console.log('Base Sprite class die.');

            this._isDead = true;

            this.loadTexture(Animation.EXPLODE_ID);
            this.animations.add(Animation.EXPLODE_ID, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);

            this.play(Animation.EXPLODE_ID, 30, false);

            this.animations.currentAnim.onComplete.add(() => {
                this.exists = false;
            }, this);
        }

        public get died() : boolean {
            return this._isDead;
        }

        public getLoot() {
            console.log('Base Sprite get loot!');
        }

        public reset() : Sprite {
            this._isDead = false;
            this.exists = true;
            this.visible = true;
            this.loadTexture(this._id);
            return this;
        }
    }
}

