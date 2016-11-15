namespace PCGGame {

    export class Player extends Sprite {

        public static ID : string = 'Player';
        public static BULLET_ID : string = 'Player.Bullet';
        public static VELOCITY_INC : number = 5;
        public static NUM_BULLETS : number = 100;


        public _minX : number = 0;
        public _maxX : number = 0;
        private _body : Phaser.Physics.Arcade.Body;


        public set minX(n : number) {
            this._minX = n;
            this.x = Math.max(this.position.x, this._minX);
            this._body.velocity.y = 0;
        }

        public set maxX(n : number) {
            this._maxX = n;
            this.x = Math.min(this.position.x, this._maxX);
        }


        public constructor(game : Phaser.Game) {

            super(game, game.width/4, game.height/2, Player.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            this.scale.set(1.2);


            this._weapon = game.add.weapon(Player.NUM_BULLETS, Player.BULLET_ID);

            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width * 4;


            //  Because our bullet is drawn facing up, we need to offset its rotation:
            this._weapon.bulletAngleOffset = 0;

            this._weapon.fireAngle = Phaser.ANGLE_RIGHT;



            //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
            this._weapon.fireRate = 80;

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = 10;

            this._weapon.trackSprite(this, 16, 0);


            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            this._body = <Phaser.Physics.Arcade.Body>this.body;

            this._body.allowGravity = false;

            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);




        }

        private _updateBulletSpeed(speed? : number) {
            let playerBody = this._body;

            this._weapon.bulletSpeed = (speed || playerBody.velocity.x) + 200;
        }


        public moveRight() : void {
            this.x += Player.VELOCITY_INC;

            this.x = Math.min(this.x, this._maxX);

            this._updateBulletSpeed();
        }


        public moveLeft() : void {

            this.x -= Player.VELOCITY_INC;
            this.x = Math.max(this.x, this._minX);

            this._updateBulletSpeed();
        }

        public fire() : void {
            this._weapon.fire();
        }

        public get died() : boolean {
            return this._isDead;
        }

        public die() : void {


            if (this.died) {
                return;
            }

            this._isDead = true;

            this.loadTexture(Animation.EXPLODE_ID);
            this.animations.add(Animation.EXPLODE_ID, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);

            this.play(Animation.EXPLODE_ID, 30, false);

            this.animations.currentAnim.onComplete.add(() => {
                this.reset();
            }, this);

            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
        }

        public reset() : Player {
            super.reset();
            let playerBody = this._body;
            playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            return this;
        }

        public get bullets() : Phaser.Group {
            return this._weapon.bullets;
        }

        public takeDamage(damage : number) {
            console.log(this.health, damage);

            if (this.health - damage <= 0) {
                this.die();
                return;
            }

            this.health -= damage;
            this.tweenSpriteTint(this, 0xff00ff, 0xffffff, 1000);



        }

    }

}