namespace Generator {
    export class MOBGenerator {
        private _randomGenerator: Phaser.RandomDataGenerator;
        private _blockPool : Helper.Pool<Block>;
        private _lastGeneratedBlock : Block;


        private _blocksQueue: Block[] = new Array(Parameters.GRID.CELL.SIZE);
        private _blocksQueueTop: number = 0;
        private _experientialGameManager : PCGGame.ExperientialGameManager = null;

        constructor(randomGenerator: Phaser.RandomDataGenerator) {
            this._randomGenerator = randomGenerator;

            // pool of blocks
            this._blockPool = new Helper.Pool<Block>(Block, Parameters.GRID.CELL.SIZE);
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

        public addMob(x: number, y: number, offsetX: number = 0, offsetY: number = 0) : Block {
            let block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = 1;


            this.addBlockToQueue(block);

            return block;
        }


        public generateMOBs(lastTile: Phaser.Point): void {
            let block = this._generate(lastTile);

            // add to queue
            this.addBlockToQueue(block);
        }


        public set updateLastBlockX(x : number) {
            this._lastGeneratedBlock.position.x = x;
        }

        private _generate(lastPosition: Phaser.Point): Block {

            let generatorParams =  this._experientialGameManager.generatorParameters;

            let block = this._createBlock();
            block.type = 2 + this._experientialGameManager.mobDistributionFn.call(this);

            // Y POSITION
            // shift by upper bound to get right y level on screen
            block.position.y =  this._randomGenerator.integerInRange(generatorParams.MOBS.MIN_Y_DISTANCE, generatorParams.MOBS.MAX_Y_DISTANCE); //newY + upperBlockBound;


            // position of next tile in x direction
            let shiftX = this._randomGenerator.integerInRange(generatorParams.MOBS.MIN_X_DISTANCE, generatorParams.MOBS.MAX_X_DISTANCE);

            // new absolute x position
            block.position.x = lastPosition.x + shiftX;


            // LENGTH
            block.length = 1;

            // RESULT
            this._lastGeneratedBlock = block;

            //console.warn(block);

            return block;
        }
    }
}