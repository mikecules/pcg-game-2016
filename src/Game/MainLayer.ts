namespace PCGGame {
    import Parameters = Generator.Parameters;
    const enum generateStateEnum { PROCESS_BLOCK, GENERATE_BLOCK };

    export class MainLayer extends Phaser.Group {
        private _generator: Generator.Generator;
        private _wallsPool: Helper.Pool<Phaser.Sprite>;
        private _walls: Phaser.Group;
        private _lastTile: Phaser.Point = new Phaser.Point(0, 0);
        private _state: generateStateEnum;
        // piece generated with generator
        private _block: Generator.Block = null;


        public render(): void {
            this._walls.forEachExists(function (sprite: Phaser.Sprite) {
                this.game.debug.body(sprite);
            }, this);
        }


        public constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer) {
            super(game, parent);

            let randomGenerator = game.rnd;

            // platforms generator
            this._generator = new Generator.Generator(randomGenerator);
            // pool of walls
            this._wallsPool = new Helper.Pool<Phaser.Sprite>(Phaser.Sprite, Generator.Parameters.GRID.CELL.SIZE / 2, function () { // add empty sprite with body
                let sprite = new Phaser.Sprite(game, 0, 0, 'Block');
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

            // set initial tile for generating
            this._block = this._generator.addBlock(0, this.game.rnd.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), randomGenerator.integerInRange(1, 3));
            this._state = generateStateEnum.PROCESS_BLOCK;
        }


        public generate(leftTile: number): void {
            // remove tiles too far to left
            this._cleanTiles(leftTile);
            // width of screen rounded to whole tiles up
            let width = Math.ceil(this.game.width / Generator.Parameters.GRID.CELL.SIZE);

            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastTile.x < leftTile + width) {
                switch (this._state) {
                    case generateStateEnum.PROCESS_BLOCK:
                        this._lastTile.copyFrom(this._block.position);
                        let length = this._block.length;
                        // process piece
                        while (length > 0) {
                            this._addBlock(this._lastTile.x, this._lastTile.y);
                            if ((--length) > 0) {
                                ++this._lastTile.x;
                            }
                        }
                        // return processed piece into pool
                        this._generator.destroyBlock(this._block);
                        // generate next platform
                        this._state = generateStateEnum.GENERATE_BLOCK;
                        break;

                    case generateStateEnum.GENERATE_BLOCK:


                            this._block = this._generator.generate(this._lastTile);
                            this._state = generateStateEnum.PROCESS_BLOCK;
                            break;

                }
            }
        }

        private _cleanTiles(leftTile: number) : void {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (let i = this._walls.length - 1; i >= 0; i--) {
                let wall = <Phaser.Sprite>this._walls.getChildAt(i);
                if (wall.x - leftTile <= -64) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallsPool.destroyItem(wall);
                }
            }
        }

        private _addBlock(x: number, y: number): void {
            // sprite  get from pool
            let sprite = this._wallsPool.createItem();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            sprite.exists = true;
            sprite.visible = true;

            // add into walls group
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        }
    }
}