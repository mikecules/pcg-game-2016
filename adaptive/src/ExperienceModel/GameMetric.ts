namespace PCGGame {
    import blockTypeEnum = Generator.blockTypeEnum;
    import game = PIXI.game;

    export class GameMetric {

        public static MOB_TYPES = [
            'Notch',
            'Meteor',
            'Invader',
            'MegaHead',
            'Platform',
            'PushPlatform'
        ];


        //private _highestDa

        public playerDeathCount: number = 0;

        public playerDeathCountForMobType: any = {};

        public mobDeathCount: number = 0;
        public mobDeathCountForType: any = {};

        public playerDamageReceivedCount: number = 0;

        public playerDamageForMobType: any = {};
        public mobDamagedByPlayer: any = {};


        public numberOfPlatformCollisions: number = 0;
        public lastPlayerDeathTimeMS: number = 0;
        public lastPlayerDamageTimeMS: number = 0;

        public timeElapsedMS : number = 0;
        public ticks : number = 0;


        public playerHealthSum : number = 0;


        public constructor() {
            this.reset();
        }


        public mobKilled(sprite: Sprite) {

            let mobType: number = this._getMobType(sprite);

            this.mobDeathCountForType[this._getMobKeyForType(mobType)]++;

            this.mobDeathCount++;
        }

        public playerDamagedBy(sprite: Sprite, damage: number) {
            //console.log('MM !!! Player damaged by ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.playerDamageForMobType[this._getMobKeyForType(mobType)] += damage;

            this.playerDamageReceivedCount += damage;

            this.lastPlayerDamageTimeMS = 0;
        }

        public mobDamagedReceieved(sprite: Sprite, damage: number) {
            //console.log('MM !!! Mob damaged by Player ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.mobDamagedByPlayer[this._getMobKeyForType(mobType)] += damage;

        }

        public playerKilledBy(sprite: Sprite) {
            //console.log('!!! Player killed by ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.playerDeathCountForMobType[this._getMobKeyForType(mobType)]++;

            this.playerDeathCount++;
            this.lastPlayerDeathTimeMS = 0;
        }

        private _getMobType(sprite: Sprite): number {
            return Generator.Block.getMobEnumType(sprite);
        }

        private _getMobKeyForType(type: number): string {
            let mobClass: string = 'MOB_NULL';

            switch (type) {
                case blockTypeEnum.MOB_NOTCH:
                    mobClass = 'Notch';
                    break;
                case blockTypeEnum.MOB_METEOR:
                    mobClass = 'Meteor';
                    break;
                case blockTypeEnum.MOB_INVADER:
                    mobClass = 'Invader';
                    break;
                case blockTypeEnum.MOB_MEGA_HEAD:
                    mobClass = 'MegaHead';
                    break;
                case blockTypeEnum.PLATFORM_TYPE:
                    mobClass = 'Platform';
                    break;
                case blockTypeEnum.PUSH_PLATFORM_TYPE:
                    mobClass = 'PushPlatform';
                    break;
                default:
                    break;
            }

            return mobClass;
        }

        public mergeStats(gameMetric : GameMetric) : GameMetric {

            for (let i = 0; i < GameMetric.MOB_TYPES.length; i++) {
                let mob = GameMetric.MOB_TYPES[i];

                this.mobDeathCountForType[mob] += gameMetric.mobDeathCountForType[mob];
                this.playerDeathCountForMobType[mob] += gameMetric.playerDeathCountForMobType[mob];
                this.playerDamageForMobType[mob] += gameMetric.playerDamageForMobType[mob];
                this.mobDamagedByPlayer[mob] += gameMetric.mobDamagedByPlayer[mob];
            }


            this.playerDeathCount += gameMetric.playerDeathCount;
            this.playerDamageReceivedCount += gameMetric.playerDamageReceivedCount;
            this.mobDeathCount += gameMetric.mobDeathCount;

            this.numberOfPlatformCollisions += gameMetric.numberOfPlatformCollisions;

            this.lastPlayerDeathTimeMS += gameMetric.lastPlayerDeathTimeMS;
            this.lastPlayerDamageTimeMS += gameMetric.lastPlayerDamageTimeMS;
            this.timeElapsedMS += gameMetric.timeElapsedMS;

            return this;
        }


        public tick(timeElapsedMS : number, playerHealth: number) {
            this.lastPlayerDeathTimeMS += timeElapsedMS;
            this.lastPlayerDamageTimeMS += timeElapsedMS;
            this.timeElapsedMS += timeElapsedMS;
            this.playerHealthSum += playerHealth;
            this.ticks++;
        }

        public averagePlayerHealth() : number {
            return this.ticks > 0 ? Math.round(this.playerHealthSum / this.ticks) : 0;
        }

        public getMostDangerousMobs() : any[] {

            let killWeight = 2;
            let damageWeight = 1;
            let mobWeightVector : any[] = [];



            for (let i = 0; i < GameMetric.MOB_TYPES.length; i++) {
                let mob = GameMetric.MOB_TYPES[i];

                // ignore notch as he is friendly
                if (mob === 'Notch') {
                    continue;
                }

                let mobObject : any = {
                    'mob': mob,
                    'dangerWeight': (this.playerDeathCountForMobType[mob] * killWeight) + (this.playerDamageForMobType[mob] * damageWeight)
                };

                mobWeightVector.push(mobObject);
            }



            mobWeightVector.sort((a : any, b: any) => b.dangerWeight - a.dangerWeight);


            return mobWeightVector;
        }


        public reset() {

            for (let i = 0; i < GameMetric.MOB_TYPES.length; i++) {
                let mob = GameMetric.MOB_TYPES[i];

                this.mobDeathCountForType[mob] = 0;
                this.playerDeathCountForMobType[mob] = 0;
                this.playerDamageForMobType[mob] = 0;
                this.mobDamagedByPlayer[mob] = 0;
            }


            this.playerDeathCount = 0;
            this.playerDamageReceivedCount = 0;
            this.mobDeathCount = 0;

            this.numberOfPlatformCollisions = 0;
            this.ticks = 0;

            this.timeElapsedMS = 0;
            this.lastPlayerDeathTimeMS = 0;
            this.lastPlayerDamageTimeMS = 0;

        }
    }
}