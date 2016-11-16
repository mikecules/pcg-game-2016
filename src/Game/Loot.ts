namespace PCGGame {
    export const enum lootTypeEnum {DEFAULT = 1, WEAPON, SHIELD, NEW_LIFE};

    export class Loot {
        private _type : number = lootTypeEnum.DEFAULT;
        private _tint : number = 0x9975B9;
        private _typeProbabilitiesUpperBoundary : any = {};
        private _typeProbabilities : any  = {};
        private _randomGenerator : Phaser.RandomDataGenerator = null;

        public value : number = 5;

        public constructor(randomGen: Phaser.RandomDataGenerator) {

            this._typeProbabilities[lootTypeEnum.DEFAULT] = 33;
            this._typeProbabilities[lootTypeEnum.WEAPON] = 32;
            this._typeProbabilities[lootTypeEnum.SHIELD] = 32;
            this._typeProbabilities[lootTypeEnum.NEW_LIFE] = 3;


            this._randomGenerator = randomGen;

            this._calcProbabilityBoundaries();

            this._type = this._calcType();
            this._calcLootTint();

        }

        private _calcProbabilityBoundaries() {
            let lastLootType: any = null;

            for (let lootType in this._typeProbabilities) {

                if (lastLootType === null) {
                    this._typeProbabilitiesUpperBoundary[lootType] = this._typeProbabilities[lootType];
                }
                else {
                    this._typeProbabilitiesUpperBoundary[lootType] = this._typeProbabilitiesUpperBoundary[lastLootType] + this._typeProbabilities[lootType];
                }

                lastLootType = lootType;

            }

            console.log(this._typeProbabilitiesUpperBoundary);
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

            let p = this._randomGenerator.integerInRange(0, 100);
            let type = lootTypeEnum.DEFAULT;

            for (let i = lootTypeEnum.DEFAULT; i <= lootTypeEnum.NEW_LIFE; i++) {
                if (p <= this._typeProbabilitiesUpperBoundary[i]) {
                   type = i;
                   break;
                }
            }

            console.log('TYPE CHOSEN:', type);
            return type;
        }

        private _calcLootTint() {
            let tint = 0x9975B9;

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
                default:
                    break;
            }

            this._tint = tint;
        }

    }


}