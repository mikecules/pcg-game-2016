namespace PCGGame {
    export class Play extends Phaser.State {

        private _mainLayer: MainLayer;
        private _backgroundLayer: BackgroundLayer;
        private _player : Player;
        private _gameScore : number = 0;
        private _gameScoreText : Phaser.Text;
        private _gameGameStateText : Phaser.Text;
        private _playerLives : number = 3;
        private _playLivesFirstX : number = 0;
        private _playerLivesGroup : Phaser.Group;


        private _gameState : any = {
            end: false,
            paused: false
        };

        private _fireKey : Phaser.Key;

        private _keysPressed : any = {
            fire: false
        };

        private _cursors : Phaser.CursorKeys = null;


        public set incScore(score : number) {
            this._gameScore += score;
            this._gameScoreText.text = `Score: ${this._gameScore}`;
        }

        public setPlayerLives(incDec : number) {
            this._playerLives += incDec;

            if (incDec < 0) {

                while ((incDec++) < 0) {
                    let live = this._playerLivesGroup.getFirstAlive();

                    if (live) {
                        live.kill();
                    }
                }

            }
            else if (incDec > 0) {

                for (let i = 0; i < incDec; i++) {
                    this._playLivesFirstX -= Generator.Parameters.GRID.CELL.SIZE + (5);
                    console.log(this._playLivesFirstX);
                    let ship = this._playerLivesGroup.create(this._playLivesFirstX,  Generator.Parameters.GRID.CELL.SIZE, Player.ID);
                    ship.anchor.setTo(0.5, 0.5);
                    ship.angle = 90;
                    ship.alpha = 0.8;
                }

            }

            if (this._playerLives <= 0) {
                // Game over
            }

        }


        private _setUpGameHUD() {
            //  The score
            let scoreString = 'Score: ';
            this._gameScoreText = this.game.add.text(10, 15, scoreString + this._gameScore, { font: '32px Arial', fill: '#fff' });

            //  Lives
            this._playerLivesGroup = this.game.add.group();

            for (let i = 0; i < this._playerLives; i++) {
                let ship = this._playerLivesGroup.create(this.game.world.width - 100 + (Generator.Parameters.GRID.CELL.SIZE * i), Generator.Parameters.GRID.CELL.SIZE, Player.ID);

                if (! this._playLivesFirstX) {
                    this._playLivesFirstX = this.game.world.width - 100;
                }

                ship.x += i > 0 ? (5 * i) : 0;
                ship.anchor.setTo(0.5, 0.5);
                ship.angle = 90;
                ship.alpha = 0.8;
            }

            //  Text
            this._gameGameStateText = this.game.add.text(this.game.world.centerX, this.game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
            this._gameGameStateText.anchor.setTo(0.5, 0.5);
            this._gameGameStateText.visible = false;

        }


        public create() {
            this.game.time.advancedTiming = true;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;

            PCGGame.SpriteSingletonFactory.instance(this.game);

            this._setUpGameHUD();

            this._player = new Player(this.game);

            this._player.position.set(Generator.Parameters.GRID.CELL.SIZE, (PCGGame.Global.SCREEN.HEIGHT - Generator.Parameters.PLAYER.BODY.HEIGHT)/2);


            this._backgroundLayer = new BackgroundLayer(this.game, this.world);
            this._mainLayer = new MainLayer(this.game, this.world);


            this.world.add(this._player);


            this._fireKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

            this._fireKey.onDown.add(() => {
                this._keysPressed.fire = true;
                console.log('Space Fire Key Down!');
            }, this);


            this._fireKey.onUp.add(() => {
                this._keysPressed.fire = false;
                console.log('Space Fire Key Up!');
            }, this);


            this.game.input.onDown.add(() => {
                this._keysPressed.fire = true;
                console.log('Mouse Fire Key Down!');
            }, this);

            this.game.input.onUp.add(() => {
                this._keysPressed.fire = false;
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

        public render() {
            this._mainLayer.render();
        }

        public update() {

            if (this._gameState.end || this._gameState.paused) {
                return;
            }



            //this.game.debug.text((this.game.time.fps.toString() || '--') + 'fps', 2, 14, "#00ff00");
            //console.log((this.game.time.fps.toString() || '--') + 'fps');

            this.camera.x += this.time.physicsElapsed * Generator.Parameters.VELOCITY.X; //this._player.horizontalX - Generator.Parameters.GRID.CELL.SIZE * 1.5;
            this._gameScoreText.x = this.camera.x + 10;
            this._playerLivesGroup.x = this.camera.x + 10;

            this.updatePhysics();

            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE);

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

            this.incScore = 10;

            bullet.kill();
            mob.die(this._player);
        }

        public wallPlayerCollisionHandler(player : Player, wall : Phaser.Sprite) {

            player.takeDamage(10);

            player.isInvincible = true;
            setTimeout(() => {
                player.isInvincible = false;
            }, 2000);

            //player.kill();
            //wall.kill();
        }

        public mobPlayerCollisionHandler(player : Player, mob : Sprite) {

            //player.kill();

            if (! mob.died) {
                player.takeDamage(mob.getDamageCost());
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

            if (! this._player.isInvincible) {
                this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks, this.wallPlayerCollisionHandler);
                this.physics.arcade.collide(this._player, this._mainLayer.mobs, this.mobPlayerCollisionHandler);


                this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.wallBlocks, this.wallBulletCollisionHandler, null, this);
                this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.mobs, this.mobBulletCollisionHandler, null, this);

            }

            //console.log('Invicibility: ', this._player.isInvincible);

            this._mainLayer.mobs.forEachExists((mob: any) => { mob.render(this._player); }, this);


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