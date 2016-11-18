namespace Generator {

    export const enum blockTypeEnum {UNKNOWN_TYPE = 0, PLATFORM_TYPE, MOB_NOTCH, MOB_METEOR, MOB_INVADER, MOB_MEGA_HEAD};

    export class Block {

        // absolute position of left cell / tile
        public position : Phaser.Point = new Phaser.Point(0, 0);

        // offset from end of previous piece
        public offset : Phaser.Point = new Phaser.Point(0, 0);

        // length in cells / tiles
        public length: number;
        public rows : number;
        public isHollow : boolean = false;


        public type : number = blockTypeEnum.UNKNOWN_TYPE;

        public reset() {
            this.length = 1;
            this.rows = 1;
            this.isHollow = false;
            this.position.x = 0;
            this.position.y = 0;

            this.offset.x = 0;
            this.offset.y = 0;
        }
    }
}