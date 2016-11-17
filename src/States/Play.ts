namespace PCGGame {
    export class Play extends Phaser.State {

        public static GAME_INTRO_TEXT : string = 'Press fire button to start.';
        public static GAME_OVER_TEXT : string = 'Game Over...\n\nPress fire button to continue.';
        public static SHIELD_ID : string = 'Shield';
        public static START_GAME_INVINCIBILITY_TIME : number = 10000;

        public static POWER_UP_MESSAGE : any = {
            LIFE: 'Extra Life Gained!',
            SHIELD: 'Shield Levels Up!',
            WEAPON: 'Weapon Power Upgraded!',
            BONUS_POINTS: 'Bonus Points Received!',
            MYSTERY: 'Mystery Power Received!'
        };

        public static EXPERIENTIAL_PROMPT : string = 'Press the C key to configure your game!';

        private _mainLayer: MainLayer;
        private _backgroundLayer: BackgroundLayer;
        private _player : Player;
        private _gameScore : number = 0;
        private _gameScoreText : Phaser.Text;
        private _gameGameStateText : Phaser.Text;
        private _gameGamePowerUpText : Phaser.Text;
        private _gameExperiencePromptText : Phaser.Text;
        private _isShowingExperiencePrompt : boolean = false;
        private _extraLives : number = Player.PLAYER_LIVES - 1;
        private _playerLivesGroup : Phaser.Group;
        private _playerHealthGroup : Phaser.Group;
        private _healthBarSpriteBG : Phaser.Sprite = null;
        private _healthBarSprite : Phaser.Sprite = null;


        private _gameState : any = {
            start: true,
            end: false,
            paused: false
        };

        private _fireKey : Phaser.Key;
        private _pauseKey : Phaser.Key;
        private _invokeExperientialKey : Phaser.Key;

        private _keysPressed : any = {
            fire: false
        };

        private _cursors : Phaser.CursorKeys = null;


        public set incScore(score : number) {
            this._gameScore += score;
            this._gameScoreText.text = `Score: ${this._gameScore}`;
        }

        public setPlayerLives(incDec : number) {
            this._extraLives += incDec;


            if (this._extraLives <= 0) {
                // Game over
                this._gameOver();
            }


            let liveShipIcon = this._playerLivesGroup.getFirstAlive();
            let firstX = this.game.world.width - this._extraLives * (Generator.Parameters.GRID.CELL.SIZE + 5);
            let y = Generator.Parameters.GRID.CELL.SIZE;

            while (liveShipIcon) {
                liveShipIcon.kill();
                liveShipIcon = this._playerLivesGroup.getFirstAlive();
            }

            for (let i = 0; i < this._extraLives; i++) {

                let ship = this._playerLivesGroup.create(firstX + (Generator.Parameters.GRID.CELL.SIZE * i), y, Player.ID);

                ship.x += i > 0 ? (5 * i) : 0;
                ship.anchor.setTo(0.5, 0.5);
                ship.angle = 90;
                ship.alpha = 0.8;

            }




        }

        private _gameOver() {
            this._gameState.end = true;
            this._gameState.paused = false;
            this._gameGameStateText.visible = true;
        }


        private _invokeExperientialSurvey() {
            this.togglePause();
        }

        private _experiencePromptFlasher() {
            this._gameExperiencePromptText.visible = true;
            let tween = this.game.add.tween(this._gameExperiencePromptText).to( { alpha: 1 }, 1000, 'Linear', true);

            tween.onComplete.add( () => {
                this.game.add.tween(this._gameExperiencePromptText).to( { alpha: 0 }, 1000, 'Linear', true);
                if (this._isShowingExperiencePrompt) {
                    this._experiencePromptFlasher();
                }
                else {
                    this._gameExperiencePromptText.visible = false;
                }
            });
        }

        private _showExperientialPrompt(shouldShow : boolean) {

            if (shouldShow === this._isShowingExperiencePrompt) {
                return;
            }

            this._isShowingExperiencePrompt = shouldShow;

            if (shouldShow) {
                this._gameExperiencePromptText.alpha = 0;
                this._experiencePromptFlasher();
            }
            else {
                this._gameExperiencePromptText.alpha = 1;
            }

        }

        private _startNewGame() {
            this._player.reset();
            this._gameState.start = false;
            this._gameState.end = false;
            this._gameState.paused = false;
            this._extraLives = Player.PLAYER_LIVES - 1;
            this._gameGameStateText.text = Play.GAME_OVER_TEXT;
            this._gameGameStateText.visible = false;
            this._showExperientialPrompt(false);

            this.setPlayerLives(0);

            this._player.x = Generator.Parameters.GRID.CELL.SIZE;
            this._player.y = this.game.height / 2;

            Play.setInvincible(this._player, Play.START_GAME_INVINCIBILITY_TIME);
            this._updateShieldBar(this._player.health);

        }

        public static setInvincible(player : Player, duration? : number) {
            player.isInvincible = true;

            setTimeout(() => {
                player.isInvincible = false;
            }, (duration || 2000));

        }

        private _updateShieldBar(health : number) {
            // just a property we can tween so the bar has a progress to show
            let barWidth : number = this.game.width / 2;
            let barHeight = 10;


            if ( this._healthBarSprite === null) {
                // create a plain black rectangle to use as the background of a health meter
                let meterBackgroundBitmap = this.game.add.bitmapData(barWidth, barHeight);
                meterBackgroundBitmap.ctx.beginPath();
                meterBackgroundBitmap.ctx.rect(0, 0, meterBackgroundBitmap.width, meterBackgroundBitmap.height);
                meterBackgroundBitmap.ctx.fillStyle = '#440000';
                meterBackgroundBitmap.ctx.fill();

                this._playerHealthGroup = this.game.add.group();

                // create a Sprite using the background bitmap data
                this._healthBarSpriteBG = this.game.add.sprite(50, this.game.height - 39, meterBackgroundBitmap);
                this._healthBarSpriteBG.alpha = 0.5;
                this._playerHealthGroup.add(this._healthBarSpriteBG);

                // create a red rectangle to use as the health meter itself
                var healthBitmap = this.game.add.bitmapData(barWidth - 6, barHeight - 6);
                healthBitmap.ctx.beginPath();
                healthBitmap.ctx.rect(0, 0, healthBitmap.width, healthBitmap.height);
                healthBitmap.ctx.fillStyle = '#000';
                healthBitmap.ctx.fill();


                // create the health Sprite using the red rectangle bitmap data
                this._healthBarSprite = this.game.add.sprite(53, this.game.height - 36, healthBitmap);
                this._healthBarSprite.alpha = 0.7;
                this._playerHealthGroup.add(this._healthBarSprite);

                let shieldSprite =  this.game.add.sprite(32, this.game.height - 50, Play.SHIELD_ID);
                shieldSprite.alpha = 1;
                this._playerHealthGroup.add(shieldSprite);

                //game.add.tween(this).to({barProgress: 0}, 2000, null, true, 0, Infinity);
            }



            this._healthBarSprite.key.context.clearRect(0, 0, this._healthBarSprite.width, this._healthBarSprite.height);


            // some simple colour changing to make it look like a health bar
             if (health < 30) {
                this._healthBarSprite.key.context.fillStyle = '#f00';
             }
             else if (health < 64) {
                this._healthBarSprite.key.context.fillStyle = '#ff0';
             }
             else {
                this._healthBarSprite.key.context.fillStyle = '#0f0';
             }


            var m = health / 100;
            var bw = ((barWidth - 6) * m);



            //console.log('HEALTH BAR: ', bw);
            // draw the bar

            this._healthBarSprite.key.context.fillRect(0, 0, bw, barHeight - 6);

            // important - without this line, the context will never be updated on the GPU when using webGL
            this._healthBarSprite.key.dirty = true;


        }


        private _setUpGameHUD() {
            //  The score
            let scoreString = 'Score: ';
            this._gameScoreText = this.game.add.text(10, 15, scoreString + this._gameScore, { font: '20px opensans', fill: '#6495ED' });
            this._gameScoreText.addColor('#fff', 7);

            //  Lives
            this._playerLivesGroup = this.game.add.group();

            //  Text
            this._gameGameStateText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, Play.GAME_INTRO_TEXT, { font: '32px opensans', fill: '#fff' });
            this._gameGameStateText.anchor.setTo(0.5, 0.5);
            this._gameGameStateText.visible = true;


            this._gameGamePowerUpText = this.game.add.text(this.game.width - 100, this.game.height - 32, Play.POWER_UP_MESSAGE.WEAPON, { font: '24px opensans', fill: '#00ff00' });
            this._gameGamePowerUpText.anchor.setTo(0.5, 0.5);
            this._gameGamePowerUpText.alpha = 0;

            this._gameExperiencePromptText = this.game.add.text(this.game.world.centerX - 10, 30, Play.EXPERIENTIAL_PROMPT, { font: '24px opensans', fill: '#00ff00' });
            this._gameExperiencePromptText.anchor.setTo(0.5, 0.5);
            this._gameExperiencePromptText.addColor('#fff', 10);
            this._gameExperiencePromptText.addColor('#00ff00', 15);
            this._gameExperiencePromptText.visible = false;
        }

        private _updatePowerUpText(type : string, colour: string) {
            this._gameGamePowerUpText.text = type;
            this._gameGamePowerUpText.addColor(colour, 0);
            let tween = this.game.add.tween(this._gameGamePowerUpText).to( { alpha: 1 }, 300, 'Linear', true);

            tween.onComplete.add( () => {
                this.game.add.tween(this._gameGamePowerUpText).to( { alpha: 0 }, 2000, 'Linear', true);
            });
        }

        public togglePause() {
            this._gameState.paused = ! this._gameState.paused;
            this.game.physics.arcade.isPaused = this._gameState.paused;


            if (this._gameState.paused) {
                this._gameGameStateText.text = 'Game Paused...';
                this._gameGameStateText.visible = true;
            }
            else {
                this._gameGameStateText.visible = false;
            }


        }



        public create() {
            this.game.time.advancedTiming = true;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;

            PCGGame.SpriteSingletonFactory.instance(this.game);

            this._player = new Player(this.game);

            this._player.playerEvents.add((e : GameEvent) => {
                switch(e.type) {
                    case gameEventTypeEnum.MOB_KILLED:
                        this.setPlayerLives(-1);
                        this._updateShieldBar(0);
                        break;
                    case gameEventTypeEnum.MOB_TOOK_DAMAGE:
                        this._updateShieldBar(this._player.health);
                        break;
                    case gameEventTypeEnum.MOB_RESPAWNED:
                        this._updateShieldBar(this._player.health);
                        break;
                    case gameEventTypeEnum.MOB_RECIEVED_LOOT:

                        let loot : Loot = <Loot> e.payload;

                        console.log(e.payload);

                        switch(loot.type) {
                            case lootTypeEnum.SHIELD:
                                this._updateShieldBar(this._player.health);
                                this._updatePowerUpText(Play.POWER_UP_MESSAGE.SHIELD, '#B22222');
                                break;
                            case lootTypeEnum.WEAPON:
                                this._updatePowerUpText(Play.POWER_UP_MESSAGE.WEAPON, '#6495ED');
                                break;
                            case lootTypeEnum.NEW_LIFE:
                                this.setPlayerLives(1);
                                this._updatePowerUpText(Play.POWER_UP_MESSAGE.LIFE, '#00ff00');
                                break;
                            case lootTypeEnum.MYSTERY_LOOT:
                                this._updatePowerUpText(Play.POWER_UP_MESSAGE.MYSTERY, '#FFD700');
                                this.incScore = loot.value * 500;
                                break;
                            default:
                                this.incScore = loot.value * 250;
                                this._updatePowerUpText(Play.POWER_UP_MESSAGE.BONUS_POINTS, '#9400D3');
                                break;
                        }
                        break;
                    default:
                        break;
                }
                
                console.log(e);

            });

            this._player.position.set(Generator.Parameters.GRID.CELL.SIZE, (PCGGame.Global.SCREEN.HEIGHT - Generator.Parameters.PLAYER.BODY.HEIGHT)/2);


            this._backgroundLayer = new BackgroundLayer(this.game, this.world);
            this._mainLayer = new MainLayer(this.game, this.world);


            this.world.add(this._player);

            this._setUpGameHUD();
            this._updateShieldBar(this._player.health);



            this._fireKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this._pauseKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
            this._invokeExperientialKey = this.game.input.keyboard.addKey(Phaser.Keyboard.C);

            this._invokeExperientialKey.onDown.add(() => {
                console.log('Invoke Experiential Dialogue');
                this._invokeExperientialSurvey();
            }, this);

            this._pauseKey.onUp.add(() => {
                console.log('Pause Key pressed!');
                this.togglePause();
            }, this);

            this._fireKey.onDown.add(() => {
                this.startPlayerAttack(true);
                console.log('Space Fire Key Down!');
            }, this);


            this._fireKey.onUp.add(() => {
                this.startPlayerAttack(false);
                console.log('Space Fire Key Up!');
            }, this);


            this.game.input.onDown.add(() => {
                this.startPlayerAttack(true);
                console.log('Mouse Fire Key Down!');
            }, this);

            this.game.input.onUp.add(() => {
                this.startPlayerAttack(false);
                console.log('Mouse Fire Key Up!');
            }, this);


            this._cursors = this.game.input.keyboard.createCursorKeys();

            // You can handle mouse input by registering a callback as well
            // The following registers a callback that will be called each time the mouse is moved
            var lastX : any = null;

            this.game.input.addMoveCallback((pointer:Phaser.Pointer,x:number,y:number) => {

                if (lastX === null) {
                    lastX = x;
                }

                let dx = x - lastX;
                this._player.position.y = y;
                this._player.position.x += dx;

                lastX = x;
            }, this);


        }

        public startPlayerAttack(shouldStartAttacking : boolean) {

            if (shouldStartAttacking) {
                if (this._gameState.end || this._gameState.start) {
                    this._startNewGame();
                }
                else if (this._gameState.paused) {
                    this.togglePause();
                }
            }

            this._keysPressed.fire = shouldStartAttacking;
        }



        public render() {
            this._mainLayer.render();
        }

        public update() {

            if (this._gameState.paused || this._gameState.end) {
                this._player.body.velocity.x = 0;
                return;
            }

            //this.game.debug.text((this.game.time.fps.toString() || '--') + 'fps', 2, 14, "#00ff00");
            //console.log((this.game.time.fps.toString() || '--') + 'fps');

            this.camera.x += this.time.physicsElapsed * Generator.Parameters.VELOCITY.X; //this._player.horizontalX - Generator.Parameters.GRID.CELL.SIZE * 1.5;

            let x = this.camera.x + 10;

            this._gameScoreText.x = x;
            this._playerLivesGroup.x = x;
            this._playerHealthGroup.x = x;
            this._gameGameStateText.x = this.game.width/2 + x ;
            this._gameGamePowerUpText.x = x + this.game.width - 200;
            this._gameExperiencePromptText.x = x + this.game.width/2;

            this.updatePhysics();

            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE, this._gameState);

            this._backgroundLayer.render(this.camera.x);

            //this.game.debug.bodyInfo(this._player, 32, 32);
        }

        public wallBulletCollisionHandler(bullet : Phaser.Sprite, wall : Phaser.Sprite) {

            bullet.kill();
            //wall.kill();
        }

        public mobBulletCollisionHandler(bullet : Phaser.Sprite, mob : Sprite) {

            if (mob.died) {
                return;
            }

            this.incScore = mob.getKillScore();

            bullet.kill();

            if (mob instanceof MegaHead) {
                mob.takeDamage(10);

                if (mob.health <= 0) {
                    mob.die(this._player);
                }
            }
            else {
                mob.die(this._player);
            }
            // TODO: FIRE SIGNAL OF MOB DEATH
        }


        public wallPlayerCollisionHandler(player : Player, wall : Phaser.Sprite) {

            player.takeDamage(10);
            Play.setInvincible(player);

            //wall.kill();
        }

        public mobPlayerCollisionHandler(player : Player, mob : Sprite) {


            if (! mob.canCollide) {
                return;
            }

            if (! mob.died) {

                if (! player.isInvincible) {
                    player.takeDamage(mob.getDamageCost());
                }

                mob.die(player);
            }
            else {

                if (mob.hasLoot) {
                    player.takeLoot(mob.getLoot());
                }

                mob.kill();
            }

        }


        public updatePhysics() {
            let playerBody = <Phaser.Physics.Arcade.Body>this._player.body;

            if (! this._player.isInvincible && ! this._gameState.start) {
                this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks, this.wallPlayerCollisionHandler);
            }

            this.physics.arcade.collide(this._player, this._mainLayer.mobs, this.mobPlayerCollisionHandler);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.wallBlocks, this.wallBulletCollisionHandler, null, this);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.mobs, this.mobBulletCollisionHandler, null, this);

            //console.log('Invicibility: ', this._player.isInvincible);

            let shouldShowExperientialPrompt = false;

            this._mainLayer.mobs.forEachExists((mob: any) => {
                mob.render(this._player);

                if (mob instanceof Notch) {
                    shouldShowExperientialPrompt = true;
                }

            }, this);


            this._showExperientialPrompt(shouldShowExperientialPrompt);



            if (playerBody.velocity.x < Generator.Parameters.VELOCITY.X)  {
                playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            }

            this._player.minX = this.game.camera.x + Generator.Parameters.GRID.CELL.SIZE;

            this._player.maxX = this.game.camera.x + this.game.width - this._player.width/2;


            // /console.log(playerBody.velocity.x ,Generator.Parameters.VELOCITY.X);


            if (this._keysPressed.fire) {
                this._player.fire();
            }

            if (this._cursors.left.isDown) {
                this._player.moveLeft();
            }
            else if (this._cursors.right.isDown) {
                this._player.moveRight();
            }

            if (this._cursors.up.isDown) {
                this._player.position.y = Math.max(playerBody.halfHeight, this._player.position.y - 5);
            }
            else if (this._cursors.down.isDown) {
                this._player.position.y = Math.min(PCGGame.Global.SCREEN.HEIGHT - playerBody.halfHeight, this._player.position.y + 5);
            }



            //console.log(wallBlockCollision);
        }
    }
}