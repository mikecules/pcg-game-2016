namespace PCGGame {

    export class Player extends Phaser.Sprite {

        public static ID : string = 'Player';
        public static BULLET_ID : string = 'Player.Bullet';
        public static VELOCITY_INC : number = 5;
        public static NUM_BULLETS : number = 100;

        private _body : Phaser.Physics.Arcade.Body;
        private _weapon : Phaser.Weapon;
        private _isDead : boolean = false;


        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Player.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;


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


        public speedUp() : void {
            let playerBody = this._body;

            playerBody.velocity.x =  Math.max(playerBody.velocity.x + Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
            this._updateBulletSpeed();
        }


        public slowDown() : void {
            let playerBody = this._body;

            playerBody.velocity.x = Math.max(playerBody.velocity.x - Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
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

            let playerBody = this._body;
            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
            playerBody.velocity.set(0, 0);

        }

        public get bullets() : Phaser.Group {
            return this._weapon.bullets;
        }
    }

}