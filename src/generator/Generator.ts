namespace Generator {

    export class Generator {
        private _randomGenerator: Phaser.RandomDataGenerator;
        private _blockPool : Helper.Pool<Block>;
        private _lastGeneratedBlock : Block;
        private _jumpTables: JumpTables;

        constructor(randomGenerator: Phaser.RandomDataGenerator) {
            this._randomGenerator = randomGenerator;

            // reference to jump tables
            this._jumpTables = JumpTables.instance;

            // pool of block
            this._blockPool = new Helper.Pool<Block>(Block, 16);
        }

        private _createBlock() : Block {
            let block = this._blockPool.createItem();

            console.log(block.position.x);

            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }

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
            return block;
        }

        public generate(lastPosition: Phaser.Point): Block {
            let block = this._createBlock();
            let upperBlockBound = 0;
            let lowerBlockBound = 768 / Parameters.GRID.CELL.SIZE;

            let deltaGridY = lowerBlockBound - upperBlockBound;

console.log(lastPosition);
            // Y POSITION
            // how high can jump max
            let minY = this._jumpTables.maxOffsetY();
            // how deep can fall max
            let maxY = lowerBlockBound - upperBlockBound;

            // clear last y from upper bound, so it starts from 0
            let currentY = lastPosition.y - upperBlockBound;
            // new random y position - each y level on screen has the same probability
            let shiftY = this._randomGenerator.integerInRange(0, deltaGridY);

            // substract currentY from shiftY - it will split possible y levels to negative
            // (how much step up (-)) and positive (how much to step down (+))
            shiftY -= currentY;

            // clamp step to keep it inside interval given with maximum

            // jump offset up (minY) and maximum fall down (maxX)
            shiftY = Phaser.Math.clamp(shiftY, minY, maxY);

            // new level for platform
            // limit once more against game limits (2 free tiles on top, 1 water tile at bottom)
            let newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);

            // shift by upper bound to get right y level on screen
            block.position.y = newY + upperBlockBound;

            // offset of new piece relative to last position (end position of last piece)
            block.offset.y = block.position.y - lastPosition.y;


            // X POSITION
            let minX = this._jumpTables.minOffsetX(block.offset.y);
            let maxX = this._jumpTables.maxOffsetX(block.offset.y);


            // position of next tile in x direction
            let shiftX = this._randomGenerator.integerInRange(minX, maxX);

            // new absolute x position
            block.position.x = lastPosition.x + shiftX;

            // offset of new piece relative to last position (end position of last piece)
            block.offset.x = shiftX;

            // LENGTH
            block.length = this._randomGenerator.integerInRange(1, 5);

            // RESULT
            this._lastGeneratedBlock = block;


            return block;
        }
    }
}