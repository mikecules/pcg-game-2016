namespace Generator {

    export class Generator {
        private _randomGenerator: Phaser.RandomDataGenerator;
        private _blockPool : Helper.Pool<Block>;
        private _lastGeneratedBlock : Block;


        private _blocksQueue: Generator.Block[] = new Array(Parameters.GRID.CELL.SIZE);
        private _blocksQueueTop: number = 0;
        private _hlpPoint: Phaser.Point = new Phaser.Point();

        constructor(randomGenerator: Phaser.RandomDataGenerator) {
            this._randomGenerator = randomGenerator;

            // pool of blocks
            this._blockPool = new Helper.Pool<Block>(Block, 16);
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


        private generateBlocksPattern(lastTile: Phaser.Point, experientialGameManager: PCGGame.ExperientialGameManager): void {
            // save index of first new piece
            let oldQueueTop = this._blocksQueueTop;


            // where to start generating
            let hlpPos = this._hlpPoint;
            hlpPos.copyFrom(lastTile);


            // same length for all blocks?
            let length : any = null;

            if (this._randomGenerator.integerInRange(0, 99) < Parameters.PLATFORM_BLOCKS.NEW_PATTERN_COMPOSITION_PERCENTAGE) {
                length = this._randomGenerator.integerInRange(Parameters.PLATFORM_BLOCKS.MIN_LENGTH, Parameters.PLATFORM_BLOCKS.MAX_LENGTH);
            }


            // how many pieces to repeat in pattern
            let baseBlockCount = Parameters.PLATFORM_BLOCKS.NEW_PATTERN_REPEAT_LENGTH;

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
                    let templateBlock = this._blocksQueue[oldQueueTop + p];

                    // replicate it
                    let block = this._generate(hlpPos, length,
                        templateBlock.offset.x, templateBlock.offset.y, experientialGameManager);

                    hlpPos.copyFrom(block.position);
                    hlpPos.x += block.length - 1;

                    // add to stack
                    this.addBlockToQueue(block);
                }
            }
        }


        private generateBlocksRandomly(lastTile: Phaser.Point, experientialGameManager: PCGGame.ExperientialGameManager): void {
            let block = this._generate(lastTile);

            // add to queue
            this.addBlockToQueue(block);
        }

        public generateBlocks(lastTile: Phaser.Point , experientialGameManger?: PCGGame.ExperientialGameManager): void {
            let probability = this._randomGenerator.integerInRange(0, 99);

            if (probability < Parameters.GENERATE_BLOCK_THRESHOLD) {
                this.generateBlocksRandomly(lastTile, experientialGameManger);
            }
            else {
                this.generateBlocksPattern(lastTile, experientialGameManger);
            }
        }

        private _generate(lastPosition: Phaser.Point,
                          length?: number, offsetX?: number, offsetY?: number, experientialGameManger?: PCGGame.ExperientialGameManager): Block {
            let block = this._createBlock();
            block.type = blockTypeEnum.PLATFORM_TYPE;

            let upperBlockBound = 0;
            let lowerBlockBound = 768 / Parameters.GRID.CELL.SIZE;

            let deltaGridY = lowerBlockBound - upperBlockBound;


            // Y POSITION
            let minY = -5;


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
            let shiftX = offsetX || this._randomGenerator.integerInRange(Parameters.PLATFORM_BLOCKS.MIN_DISTANCE, Parameters.PLATFORM_BLOCKS.MAX_DISTANCE);

            // new absolute x position
            block.position.x = lastPosition.x + shiftX;

            // offset of new piece relative to last position (end position of last piece)
            block.offset.x = shiftX;

            // LENGTH
            block.length = length || this._randomGenerator.integerInRange(Parameters.PLATFORM_BLOCKS.MIN_LENGTH, Parameters.PLATFORM_BLOCKS.MAX_LENGTH);

            // RESULT
            this._lastGeneratedBlock = block;


            return block;
        }
    }
}