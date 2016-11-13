namespace Generator {
    export class Block {

        // absolute position of left cell / tile
        public position = new Phaser.Point(0, 0);

        // offset from end of previous piece
        public offset = new Phaser.Point(0, 0);

        // length in cells / tiles
        public length: number;
    }
}