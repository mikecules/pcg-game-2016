namespace Generator {

    export const enum blockTypeEnum {PLATFORM_TYPE = 1, MOB_NULL, MOB_NOTCH, MOB_METEOR, MOB_INVADER, MOB_MEGA_HEAD};

    export class Block {

        // absolute position of left cell / tile
        public position : Phaser.Point = new Phaser.Point(0, 0);

        // offset from end of previous piece
        public offset : Phaser.Point = new Phaser.Point(0, 0);

        // length in cells / tiles
        public length: number;
        public rows : number;
        public isHollow : boolean = false;


        public type : number = blockTypeEnum.MOB_NULL;


        public static getMobEnumType(sprite : PCGGame.Sprite) : number {

        let type : number = blockTypeEnum.MOB_NULL;

        if (sprite instanceof PCGGame.Notch) {
            type = blockTypeEnum.MOB_NOTCH;
        }
        else if (sprite instanceof PCGGame.Meteor) {
            type = blockTypeEnum.MOB_METEOR;
        }
        else if (sprite instanceof PCGGame.Invader) {
            type = blockTypeEnum.MOB_INVADER;
        }
        else if (sprite instanceof PCGGame.Platform) {
            type = blockTypeEnum.PLATFORM_TYPE
        }
        else if (sprite instanceof PCGGame.MegaHead) {
            type = blockTypeEnum.MOB_MEGA_HEAD;
        }

        return type;
    }

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