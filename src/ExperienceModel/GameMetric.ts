namespace PCGGame {
    import blockTypeEnum = Generator.blockTypeEnum;

    export class GameMetric {

        public static MOB_TYPES = [
            'Notch',
            'Meteor',
            'Invader',
            'MegaHead',
            'Platform',
            'PushPlatform'
        ];

        public playerDeathCount: number = 0;

        public playerDeathCountForMobType: any = {};

        public mobDeathCount: number = 0;
        public mobDeathCountForType: any = {};

        public playerDamageReceivedCount: number = 0;

        public playerDamageForMobType: any = {};
        public mobDamagedByPlayer: any = {};


        public numberOfPlatformCollisions: number = 0;


        public constructor() {
            this.reset();
        }


        public mobKilled(sprite: Sprite) {

            let mobType: number = this._getMobType(sprite);

            this.mobDeathCountForType[this._getMobKeyForType(mobType)]++;

            this.mobDeathCount++;
        }

        public playerDamagedBy(sprite: Sprite, damage: number) {
            console.log('MM !!! Player damaged by ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.playerDamageForMobType[this._getMobKeyForType(mobType)] += damage;

            this.playerDamageReceivedCount += damage;
        }

        public mobDamagedReceieved(sprite: Sprite, damage: number) {
            console.log('MM !!! Mob damaged by Player ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.mobDamagedByPlayer[this._getMobKeyForType(mobType)] += damage;

        }

        public playerKilledBy(sprite: Sprite) {
            console.log('!!! Player killed by ', sprite);

            let mobType: number = this._getMobType(sprite);

            this.playerDeathCountForMobType[this._getMobKeyForType(mobType)]++;

            this.playerDeathCount++;
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

        }
    }
}