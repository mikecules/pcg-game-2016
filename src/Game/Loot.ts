namespace PCGGame {
    export const enum lootTypeEnum {DEFAULT, WEAPON, SHIELD, MYSTERY_LOOT, NEW_LIFE};

    export class Loot {
        private _type : number = lootTypeEnum.DEFAULT;
        private _tint : number = 0x9400D3;
        public value : number = 5;

        public constructor() {

            this._type = this._calcType();
            this._calcLootTint();

        }



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

        private _calcType() : number {
            let type = ExperientialGameManager.instance().lootDistributionFn.call(this);

            //console.log('TYPE CHOSEN:', type);
            return type;
        }

        private _calcLootTint() {
            let tint = 0x9400D3;

            switch (this._type) {
                case lootTypeEnum.WEAPON:
                    tint = 0x0000ff;
                    break;
                case lootTypeEnum.SHIELD:
                    tint = 0xff0000;
                    break;
                case lootTypeEnum.NEW_LIFE:
                    tint = 0x00ff00;
                    break;
                case lootTypeEnum.MYSTERY_LOOT:
                    tint = 0xFFD700;
                    break;
                default:
                    break;
            }

            this._tint = tint;
        }

    }


}