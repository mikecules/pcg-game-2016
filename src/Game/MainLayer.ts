namespace PCGGame {

    import blockTypeEnum = Generator.blockTypeEnum;
    const enum generateStateEnum { PROCESS_BLOCK, GENERATE_BLOCK };

    export class MainLayer extends Phaser.Group {
        private _generator: Generator.Generator;
        private _MOBgenerator: Generator.MOBGenerator;
        private _wallSpritePool: Helper.Pool<Phaser.Sprite>;
        private _MOBSpritePool: Helper.Pool<SpriteSingletonFactory>;
        private _mobs : Phaser.Group;
        private _walls: Phaser.Group;
        private _lastTile: Phaser.Point = new Phaser.Point(0, 0);
        private _lastMOB: Phaser.Point = new Phaser.Point(0, 0);
        private _platformGenerationState: generateStateEnum;
        private _mobsGenerationState: generateStateEnum;
        private _randomGenerator: Phaser.RandomDataGenerator;
        private _game : Phaser.Game;


        public render(): void {
            /* this._mobs.forEachExists(function (sprite: Phaser.Sprite) {
                this.game.debug.body(sprite);
            }, this); */

            /*let a : Phaser.Sprite = <Phaser.Sprite>this._walls.getAt(0);
            if (a) {
            this.game.debug.spriteInfo(a, 32, 32);
            }*/
        }


        public constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer) {
            super(game, parent);

            this._game = game;
            this._randomGenerator = game.rnd;

            // platforms generator
            this._generator = new Generator.Generator(this._randomGenerator);
            this._MOBgenerator = new Generator.MOBGenerator(this._randomGenerator);

            this._MOBSpritePool = new Helper.Pool<SpriteSingletonFactory>(SpriteSingletonFactory, Generator.Parameters.GRID.CELL.SIZE,  ()  => { // add empty sprite with body
                return new SpriteSingletonFactory(game);
            });

            // pool of walls
            this._wallSpritePool = new Helper.Pool<Phaser.Sprite>(Phaser.Sprite, Generator.Parameters.GRID.CELL.SIZE / 2,  ()  => { // add empty sprite with body

                let sprite = new Phaser.Sprite(game, 0, 0, 'BlockTextures', 0);

                this._changeSpriteBlockTexture(sprite);

                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                let body = <Phaser.Physics.Arcade.Body>sprite.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                return sprite;
            });

            // walls group
            this._walls = new Phaser.Group(game, this);

            this._mobs = new Phaser.Group(game, this);

            // set initial tile for generating
            this._generator.addBlock(0, this._randomGenerator.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), this._randomGenerator.integerInRange(1, 3));
            this._MOBgenerator.addMob(0, this._randomGenerator.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), this._randomGenerator.integerInRange(1, 3));

            this._platformGenerationState = generateStateEnum.PROCESS_BLOCK;
            this._mobsGenerationState = generateStateEnum.PROCESS_BLOCK;
        }

        public get wallBlocks() : Phaser.Group {
            return this._walls;
        }

        public get mobs() : Phaser.Group {
            return this._mobs;
        }


        public generate(leftTile: number): void {
            // remove tiles too far to left
            this._cleanTiles(leftTile);
            this._cleanMOBS(leftTile);

            // width of screen rounded to whole tiles up
            let width = Math.ceil(this.game.width / Generator.Parameters.GRID.CELL.SIZE);

            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastTile.x < leftTile + width) {
                switch (this._platformGenerationState) {
                    case generateStateEnum.PROCESS_BLOCK:
                        // check if queue not empty - should never happen
                        if (!this._generator.hasBlocks) {
                            console.error("Blocks queue is empty!");
                        }

                        let block = this._generator.getBlockFromQueue();

                        this._lastTile.copyFrom(block.position);
                        let length = block.length;

                        // process piece
                        while (length > 0) {
                            this._addBlockSprite(this._lastTile.x, this._lastTile.y);

                            if ((--length) > 0) {
                                ++this._lastTile.x;
                            }
                        }

                        // return processed piece into pool
                        this._generator.destroyBlock(block);

                        // generate next platform
                        if (!this._generator.hasBlocks) {
                            this._platformGenerationState = generateStateEnum.GENERATE_BLOCK;
                        }

                        break;

                    case generateStateEnum.GENERATE_BLOCK:

                            this._generator.generateBlocks(this._lastTile);
                            this._platformGenerationState = generateStateEnum.PROCESS_BLOCK;
                            break;

                }
            }


            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastMOB.x < leftTile + width) {
                switch (this._mobsGenerationState) {
                    case generateStateEnum.PROCESS_BLOCK:
                        // check if queue not empty - should never happen
                        if (!this._MOBgenerator.hasBlocks) {
                            console.error("Mob Blocks queue is empty!");
                        }

                        let block = this._MOBgenerator.getBlockFromQueue();

                        this._lastMOB.copyFrom(block.position);
                        let length = block.length;

                        // process mob
                        while (length > 0) {
                            this._addMobSprite(this._lastMOB.x, this._lastMOB.y, block.type);

                            if ((--length) > 0) {
                                ++this._lastMOB.x;
                            }
                        }

                        // return processed piece into pool
                        this._MOBgenerator.destroyBlock(block);

                        // generate next platform
                        if (!this._MOBgenerator.hasBlocks) {
                            this._mobsGenerationState = generateStateEnum.GENERATE_BLOCK;
                        }

                        break;

                    case generateStateEnum.GENERATE_BLOCK:

                        this._MOBgenerator.generateMOBs(this._lastMOB);
                        this._mobsGenerationState = generateStateEnum.PROCESS_BLOCK;
                        break;

                }
            }
        }


        private _cleanMOBS(leftTile: number) : void {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;

            for (let i = this._mobs.length - 1; i >= 0; i--) {

                let mob = <Sprite>this._mobs.getChildAt(i);

                if ((mob.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._mobs.remove(mob);
                    mob.parent = null;
                    this._MOBSpritePool.destroyItem(mob.spriteFactoryParent);
                }
            }
        }

        private _cleanTiles(leftTile: number) : void {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;

            for (let i = this._walls.length - 1; i >= 0; i--) {

                let wall = <Phaser.Sprite>this._walls.getChildAt(i);

                if ((wall.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallSpritePool.destroyItem(wall);
                }
            }
        }

        private _changeSpriteBlockTexture(sprite : any) {
            sprite.frame = this._randomGenerator.integerInRange(0, Generator.Parameters.SPRITE.FRAMES - 1);
        }

        private _addBlockSprite(x: number, y: number): void {
            // sprite  get from pool
            let sprite = this._wallSpritePool.createItem();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            sprite.exists = true;
            sprite.visible = true;

            this._changeSpriteBlockTexture(sprite);

            // add into walls group
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        }

        private _addMobSprite (x: number, y: number, mobType: number): void {


            let spriteFactory : SpriteSingletonFactory = this._MOBSpritePool.createItem();
            let sprite : any = null;


            switch (mobType) {
                case blockTypeEnum.MOB_NOTCH:
                    sprite = spriteFactory.getNotchMob();
                    break;
                case  blockTypeEnum.MOB_INVADER:
                    sprite = spriteFactory.getInvaderMob();//spriteFactory.getMeteorMob();//spriteFactory.getInvaderMob();
                    break;
                default:
                    sprite = spriteFactory.getMeteorMob();
                    break;
            }


            sprite.reset();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);


            console.log(sprite.parent);
            // add into mobs group
            if (sprite.parent === null) {
                this._mobs.add(sprite);
            }
        }
    }
}