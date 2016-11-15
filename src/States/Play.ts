namespace PCGGame {
    export class Play extends Phaser.State {

        private _mainLayer: MainLayer;
        private _backgroundLayer: BackgroundLayer;
        private _player : Player;


        private _gameState : any = {
            end: false,
            paused: false
        };

        private _fireKey : Phaser.Key;

        private _keysPressed : any = {
            fire: false
        };

        private _cursors : Phaser.CursorKeys = null;




        public create() {
            this.game.time.advancedTiming = true;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;

            PCGGame.SpriteSingletonFactory.instance(this.game)

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
            this.game.input.addMoveCallback((pointer:Phaser.Pointer,x:number,y:number) => {
                this._player.position.y = y;
            }, this);


        }

        public render() {
            this._mainLayer.render();
        }

        public update() {

            if (this._gameState.end || this._gameState.paused) {
                return;
            }

            this.updatePhysics();

            this.game.debug.text((this.game.time.fps.toString() || '--') + 'fps', 2, 14, "#00ff00");
            //console.log((this.game.time.fps.toString() || '--') + 'fps');

            this.camera.x = this._player.x - Generator.Parameters.GRID.CELL.SIZE * 1.5;

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

            bullet.kill();
            mob.die();
        }

        public wallPlayerCollisionHandler(player : Sprite, wall : Phaser.Sprite) {

            //player.kill();
            wall.kill();
        }

        public mobPlayerCollisionHandler(player : Sprite, mob : Sprite) {

            //player.kill();

            if (! mob.died) {
                mob.die();
            }

        }


        public updatePhysics() {
            let playerBody = <Phaser.Physics.Arcade.Body>this._player.body;
            let wallBlockCollision = this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks, this.wallPlayerCollisionHandler);
            let mobCollision = this.physics.arcade.collide(this._player, this._mainLayer.mobs, this.mobPlayerCollisionHandler);


            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.wallBlocks, this.wallBulletCollisionHandler, null, this);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.mobs, this.mobBulletCollisionHandler, null, this);

            if (wallBlockCollision || mobCollision) {
                this._player.die();
                return;
            }


            this._mainLayer.mobs.forEachExists((mob: any) => { mob.render(); }, this);


            if (playerBody.velocity.x < Generator.Parameters.VELOCITY.X)  {
                playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            }



            // /console.log(playerBody.velocity.x ,Generator.Parameters.VELOCITY.X);


            if (this._keysPressed.fire) {
                this._player.fire();
            }

            if (this._cursors.left.isDown) {
                this._player.slowDown();
            }
            else if (this._cursors.right.isDown) {
                this._player.speedUp();
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