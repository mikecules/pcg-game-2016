namespace Generator {

    import ExperientialGameManager = PCGGame.ExperientialGameManager;
    export class Generator {
        private _randomGenerator: Phaser.RandomDataGenerator;
        private _blockPool : Helper.Pool<Block>;
        private _lastGeneratedBlock : Block;
        private _experientialGameManager : PCGGame.ExperientialGameManager = null;


        private _blocksQueue: Generator.Block[] = new Array(Parameters.GRID.CELL.SIZE);
        private _blocksQueueTop: number = 0;
        private _hlpPoint: Phaser.Point = new Phaser.Point();

        constructor(randomGenerator: Phaser.RandomDataGenerator) {
            this._randomGenerator = randomGenerator;

            // pool of blocks
            this._blockPool = new Helper.Pool<Block>(Block, 16);
            this._experientialGameManager = PCGGame.ExperientialGameManager.instance();
        }

        private _createBlock() : Block {
            let block = this._blockPool.createItem();

            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }

            return block;
        }


        public get hasBlocks(): boolean {
            return this._blocksQueueTop > 0;
        }

        private addBlockToQueue(block: Generator.Block): void {
            // avoid creating and destroying memory as it is an expensive operation
            this._blocksQueue[this._blocksQueueTop++] = block;
        }


        public getBlockFromQueue(): Generator.Block {
            // if no blocks in queue then return null
            if (this._blocksQueueTop === 0) {
                return null;
            }

            // get first piece in queue
            let block = this._blocksQueue[0];

            // shift remaining block left by 1
            for (let i = 0; i < this._blocksQueueTop - 1; i++) {
                this._blocksQueue[i] = this._blocksQueue[i + 1];
            }

            // clear memory for the last slot in the queue and decrease queue top
            this._blocksQueue[--this._blocksQueueTop] = null;

            return block;
        }


        public destroyBlock(block: Block) : void {
            this._blockPool.destroyItem(block);
        }

        public addBlock(x: number, y: number, length: number, offsetX: number = 0, offsetY: number = 0) : Block {
            let block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = length;

            this.addBlockToQueue(block);

            return block;
        }


        private generateBlocksPattern(lastTile: Phaser.Point): void {
            // save index of first new piece
            let oldQueueTop = this._blocksQueueTop;
            let generatorParams =  this._experientialGameManager.generatorParameters;


            // where to start generating
            let hlpPos = this._hlpPoint;
            hlpPos.copyFrom(lastTile);


            // same length for all blocks?
            let length : any = null;

            if (this._randomGenerator.integerInRange(0, 99) <  generatorParams.PLATFORM.NEW_PATTERN_COMPOSITION_PERCENTAGE) {
                length = this._randomGenerator.integerInRange(
                    generatorParams.PLATFORM.MIN_LENGTH,
                    generatorParams.PLATFORM.MAX_LENGTH
                );
            }


            // how many pieces to repeat in pattern
            let baseBlockCount = generatorParams.PLATFORM.NEW_PATTERN_REPEAT_LENGTH;

            for (let i = 0; i < baseBlockCount; i++) {
                let block = this._generate(hlpPos, length);

                hlpPos.copyFrom(block.position);

                // get last tile of piece
                hlpPos.x += block.length - 1;

                // add to queue
                this.addBlockToQueue(block);
            }


            // repeat pattern X times
            let repeat = 1;

            for (let i = 0; i < repeat; i++) {

                // repeat all pieces in pattern
                for (let p = 0; p < baseBlockCount; p++) {
                    // get first piece in pattern to repeat as template
                    let templateBlock = <Block> this._blocksQueue[oldQueueTop + p];

                    // replicate it
                    let block = this._generate(hlpPos, length, templateBlock.rows,
                        templateBlock.offset.x, templateBlock.offset.y);

                    hlpPos.copyFrom(block.position);
                    hlpPos.x += block.length - 1;

                    // add to stack
                    this.addBlockToQueue(block);
                }
            }
        }


        private generateBlocksRandomly(lastTile: Phaser.Point): void {
            let block = this._generate(lastTile);

            // add to queue
            this.addBlockToQueue(block);
        }

        public generateBlocks(lastTile: Phaser.Point): void {
            let probability = this._randomGenerator.integerInRange(0, 99);

            if (probability < this._experientialGameManager.generatorParameters.PLATFORM.GENERATE_BLOCK_THRESHOLD) {
                this.generateBlocksRandomly(lastTile);
            }
            else {
                this.generateBlocksPattern(lastTile);
            }
        }

        private _generate(lastPosition: Phaser.Point,
                          length?: number, rows?: number, offsetX?: number, offsetY?: number): Block {

            let generatorParams =  this._experientialGameManager.generatorParameters;

            let block = this._createBlock();
            block.type = this._experientialGameManager.platformDistributionFn.call(this);

            let upperBlockBound = 0;
            let lowerBlockBound =  (PCGGame.Global.SCREEN.HEIGHT - Parameters.GRID.CELL.SIZE) / Parameters.GRID.CELL.SIZE;

            let deltaGridY = lowerBlockBound - upperBlockBound;


            // Y POSITION
            let minY = -generatorParams.PLATFORM.MIN_DISTANCE * 2;


            let maxY = lowerBlockBound - upperBlockBound;


            // clear last y from upper bound, so it starts from 0
            let currentY = lastPosition.y - upperBlockBound;
            // new random y position - each y level on screen has the same probability

            let shiftY = 0;



            if (typeof offsetY === 'undefined') {

                shiftY = this._randomGenerator.integerInRange(0, deltaGridY);

                // substract currentY from shiftY - it will split possible y levels to negative
                // (how much step up (-)) and positive (how much to step down (+))
                shiftY -= currentY;

                // clamp step to keep it inside interval given with maximum

                // jump offset up (minY) and maximum fall down (maxX)
                shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            }
            else {
                shiftY = offsetY
            }

            // new level for platform
            // limit once more against game limits (2 free tiles on top, 1 water tile at bottom)
            let newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);

            // shift by upper bound to get right y level on screen
            block.position.y = newY + upperBlockBound;


            // position of next tile in x direction
            let shiftX = offsetX || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_DISTANCE, generatorParams.PLATFORM.MAX_DISTANCE);

            // new absolute x position
            block.position.x = lastPosition.x + shiftX;

            // offset of new piece relative to last position (end position of last piece)
            block.offset.x = shiftX;

            // LENGTH
            block.length = length || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_LENGTH, generatorParams.PLATFORM.MAX_LENGTH);
            block.rows = rows || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_LENGTH, generatorParams.PLATFORM.MAX_LENGTH);

            if (block.rows > 2 && block.length > 2) {
                block.isHollow =  true;
            }

            // RESULT
            this._lastGeneratedBlock = block;


            return block;
        }
    }
}