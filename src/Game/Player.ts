namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;

    export class Player extends Sprite {

        public static ID : string = 'Player';
        public static BULLET_ID : string = 'Player.Bullet';
        public static VELOCITY_INC : number = 5;
        public static NUM_BULLETS : number = 150;
        public static PLAYER_LIVES : number = 2;//4;
        public static NUM_BULLET_FRAMES : number = 80;

        public static WEAPON_STATS : any = {
            fireRate: 200,
            variance: 0,
            bulletAngleVariance: 0
        };

        public static MAX_WEAPON_STATS : any = {
            fireRate: 40,
            variance: 10,
            bulletAngleVariance: 8
        };



        public playerEvents : Phaser.Signal;
        public playerLives : number = Player.PLAYER_LIVES;


        public _minX : number = 0;
        public _maxX : number = 0;
        private _bulletFrameNumber : number = 0;


        public set minX(n : number) {
            this._minX = n;
            this.x = Math.max(this.x, this._minX);
            this.body.velocity.y = 0;
        }

        public set maxX(n : number) {
            this._maxX = n;
            this.x = Math.min(this.x, this._maxX);
        }


        public constructor(game : Phaser.Game) {

            super(game, game.width/4, game.height/2, Player.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            let scale : number = 1.5;

            this.scale.set(scale);

            this.playerEvents = new Phaser.Signal();

            this.mobType = -1;

            this._weapon = game.add.weapon(Player.NUM_BULLETS, Player.BULLET_ID);

            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            //this._weapon.bulletKillDistance = this.game.width * 4;
            this._weapon.bulletKillDistance = this.game.width * 2.5;

            this._weapon.setBulletFrames(0, Player.NUM_BULLET_FRAMES, true);



            //  Because our bullet is drawn facing up, we need to offset its rotation:
            this._weapon.bulletAngleOffset = 0;

            this._weapon.bulletAngleVariance = Player.WEAPON_STATS.bulletAngleVariance;

            this._weapon.fireAngle = Phaser.ANGLE_RIGHT;



            //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 80ms
            this._weapon.fireRate = Player.WEAPON_STATS.fireRate; //80;

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = Player.WEAPON_STATS.variance; //10;

            this._weapon.trackSprite(this, 16, 0);


            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            this.body.allowGravity = false;


            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);

        }

        private _updateBulletSpeed(speed? : number) {
            let playerBody = this.body;

            this._weapon.bulletSpeed = (speed || playerBody.velocity.x) + 200;
        }


        public moveRight() : void {

            this.x = Math.min(this.x + Player.VELOCITY_INC, this._maxX);

            this._updateBulletSpeed();
        }


        public moveLeft() : void {

            this.x = Math.max(this.x - Player.VELOCITY_INC, this._minX);

            this._updateBulletSpeed();
        }

        public fire() : void {
            this._weapon.fire();
        }

        public getDamageCost() {
            return this.weaponDamageCost;
        }

        public takeLoot(loot: Loot) {
            console.log('Got loot! ', loot, loot.spriteTint);

            ExperientialGameManager.instance().evaluateLootAndInterveneIfDanger(loot);

            let type = loot.subType || loot.type;

            switch(type) {
                case lootTypeEnum.SHIELD:
                    this.health = Math.min(100, this.health + (loot.value * 2));
                    break;
                case lootTypeEnum.WEAPON:
                    this.upgradeWeapon(loot.value);
                    break;
                case lootTypeEnum.NEW_LIFE:
                    this.playerLives++;
                    break;
                default:
                    break;
            }

            this.playerEvents.dispatch(new GameEvent(gameEventTypeEnum.MOB_RECIEVED_LOOT, loot));

            this.tweenSpriteTint(this, loot.spriteTint, 0xffffff, 2000);
        }

        public upgradeWeapon(inc : number) {
            this._weapon.fireRate = Math.max(this._weapon.fireRate - inc, Player.MAX_WEAPON_STATS.fireRate); // 80;

            //  Add a variance to the bullet speed by +- this value
            this._weapon.bulletSpeedVariance = Math.max(this._weapon.bulletSpeedVariance + 1, Player.MAX_WEAPON_STATS.variance);

            this._weapon.bulletAngleVariance = Math.min(this._weapon.bulletAngleVariance + 0.5, Player.MAX_WEAPON_STATS.bulletAngleVariance);

            this._bulletFrameNumber = Math.min(this._bulletFrameNumber + 1, Player.NUM_BULLET_FRAMES);

            //this._weapon.bulletFrame = 30;//this._bulletFrameNumber;
            //this._weapon.setBulletFrames(this._bulletFrameNumber, Player.NUM_BULLET_FRAMES, false);
        }


        public die() : void {


            if (this._isDead) {
                return;
            }

            this._isDead = true;
            this.playerLives--;

            this.loadTexture(Animation.EXPLODE_ID);
            this.animations.add(Animation.EXPLODE_ID, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);

            this.play(Animation.EXPLODE_ID, 30, false);


            this.animations.currentAnim.onComplete.add(() => {

                this.playerEvents.dispatch(new GameEvent(gameEventTypeEnum.MOB_KILLED, this));

                if (this.playerLives > 0) {
                    this.resetPlayerAfterDeath();
                    this.playerEvents.dispatch(new GameEvent(gameEventTypeEnum.MOB_RESPAWNED, this));
                }
                else {
                    this.body.velocity.x = 0;
                    this.body.velocity.y = 0;
                    this.visible = false;
                }

            }, this);

            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
        }


        public resetPlayerAfterDeath() {
            super.reset();
            this.x = Generator.Parameters.GRID.CELL.SIZE;
            this.y = this.game.height / 2;
            this.visible = true;
            this.body.immovable = true;
            this.body.velocity.x = Generator.Parameters.VELOCITY.X;
        }

        public reset() : Player {

            this.resetPlayerAfterDeath();
            this.playerLives = Player.PLAYER_LIVES;

            return this;
        }

        public get bullets() : Phaser.Group {
            return this._weapon.bullets;
        }

        private _toggleInvincibilityTween(shouldReverse? : boolean) {

            let startTint : number = 0xffffff;
            let endTint : number = 0x333333;

            if (! this._isInvincible) {
                this.tint = startTint;
                return;
            }

            let reverse = shouldReverse === true ? true : false;

            if (reverse === true) {
                this.tweenSpriteTint(this, startTint, endTint, 1000, () => {
                    this._toggleInvincibilityTween(! reverse);
                });
            }
            else {
                this.tweenSpriteTint(this, endTint, startTint, 1000, () => {
                    this._toggleInvincibilityTween(! reverse);
                });
            }
        }


        public get isInvincible() : boolean {
            return this._isInvincible;
        }


        public set isInvincible(isInvincibleFlag : boolean) {
            if (isInvincibleFlag !== this._isInvincible) {
                this._isInvincible = isInvincibleFlag;
            }

            this._toggleInvincibilityTween();
        }

        public takeDamage(damage : number) {

            if (this._isInvincible) {
                return;
            }

            console.log(this.health, damage);
            this.health -= damage;

            this.playerEvents.dispatch(new GameEvent(gameEventTypeEnum.MOB_TOOK_DAMAGE, damage));

            if (this.health <= 0) {
                this.die();
                this.health = 1;
                return;
            }

            this.tweenSpriteTint(this, 0xff00ff, 0xffffff, 1000);

        }

        public isInDanger() : boolean {
            let playerInDanger = false;

            if (/*this.health <= 50 && */this.playerLives === 1) {
                playerInDanger = true;
            }


            return playerInDanger;

        }

    }

}