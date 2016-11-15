namespace PCGGame {
    export const enum lootTypeEnum {DEFAULT = 1 , HEALTH, WEAPON, SHIELD, NEW_LIFE};

    export class Loot {
        private _type : number = lootTypeEnum.DEFAULT;
        private _tint : number = 0x9975B9;

        public value : number = 0;
        public points : number = 0;


        public set type(type: number) {
            this._type = type;
            this._calcLootTint();
        }

        public get type() : number {
            return this._type;
        }


        public get spriteTint() : number {
            return this._tint;
        }


        private _calcLootTint() {
            let tint = 0x9975B9;

            switch (this._type) {
                case lootTypeEnum.HEALTH:
                    tint = 0x00ff00;
                    break;
                case lootTypeEnum.WEAPON:
                    tint = 0x0000ff;
                    break;
                case lootTypeEnum.SHIELD:
                    tint = 0xff0000;
                    break;
                case lootTypeEnum.NEW_LIFE:
                    break;

                default:
                    break;


            }

            this._tint = tint;
        }

    }


}