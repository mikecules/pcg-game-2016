namespace Generator {

    export const enum blockTypeEnum {UNKNOWN_TYPE = 0, PLATFORM_TYPE, MOB_NOTCH, MOB_METEOR, MOB_INVADER, MOB_MEGA_HEAD};

    export class Block {

        // absolute position of left cell / tile
        public position = new Phaser.Point(0, 0);

        // offset from end of previous piece
        public offset = new Phaser.Point(0, 0);

        // length in cells / tiles
        public length: number;

        public type : number = blockTypeEnum.UNKNOWN_TYPE;
    }
}