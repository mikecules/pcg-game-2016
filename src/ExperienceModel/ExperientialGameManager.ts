namespace PCGGame {
    import blockTypeEnum = Generator.blockTypeEnum;
    export class ExperientialGameManager {
        public static _instance : ExperientialGameManager = null;
        public static INTERVAL_MS : number = 5000;


        private _gameMetricSnapShots : any = {
            overall: new GameMetric(),
            previous: new GameMetric(),
            current: new GameMetric()
        };

        private _game : Phaser.Game = null;
        private _totalTimeElapsed : number = 0;
        private _currentSnapShotTime : number = 0;

        public constructor(game: Phaser.Game, player: Player) {
            this._game = game;
        }

        public static instance(game?: Phaser.Game, player?: Player) : ExperientialGameManager {

            if (ExperientialGameManager._instance === null && game && player) {
                ExperientialGameManager._instance = new ExperientialGameManager(game, player);
            }

            return ExperientialGameManager._instance;
        }

        public takeMetricSnapShot() {
            console.log(this._gameMetricSnapShots.current);
        }


        public update() {

            let lastTime = this._game.time.elapsedMS;
            this._currentSnapShotTime += lastTime;


            if (this._currentSnapShotTime >= ExperientialGameManager.INTERVAL_MS) {
                this.takeMetricSnapShot();
                this._currentSnapShotTime = this._currentSnapShotTime - ExperientialGameManager.INTERVAL_MS;
            }


            this._totalTimeElapsed += lastTime;


        }


        public playerDamageReceived(damage: number, sprite : Sprite) {
            this._gameMetricSnapShots.current.playerDamagedBy(sprite, damage);
        }

        public playerKilled(sprite: Sprite) {
            this._gameMetricSnapShots.current.playerKilledBy(sprite);
        }

        public playerCollidedWithPlatform() {
            this._gameMetricSnapShots.current.numberOfPlatformCollisions++;
        }

        public mobKilled(mob: Sprite) {
            this._gameMetricSnapShots.current.mobKilled(mob);
        }

    }

    class GameMetric {

        public playerDeathCount : number = 0;

        public playerDeathCountForType : any = {
            'Notch': 0,
            'Meteor': 0,
            'Invader': 0,
            'MegaHead': 0,
            'Platform': 0
        };

        public mobDeathCount : number = 0;
        public mobDeathCountForType : any = {
            'Notch': 0,
            'Meteor': 0,
            'Invader': 0,
            'MegaHead': 0
        };

        public playerDamageReceivedCount : number = 0;

        public playerDamageForMobType : any = {
            'Notch': 0,
            'Meteor': 0,
            'Invader': 0,
            'MegaHead': 0,
            'Platform': 0
        };


        public numberOfPlatformCollisions : number = 0;



        public mobKilled(sprite : Sprite) {

            let mobType : number = this._getMobType(sprite);

            this.mobDeathCountForType[this._getMobKeyForType(mobType)]++;

            this.mobDeathCount++;
        }

        public playerDamagedBy(sprite : Sprite, damage : number) {
            console.log('MM !!! Player damaged by ', sprite);

            let mobType : number = this._getMobType(sprite);

            this.playerDamageForMobType[this._getMobKeyForType(mobType)] += damage;

            this.playerDamageReceivedCount += damage;
        }

        public playerKilledBy(sprite : Sprite) {
            console.log('!!! Player killed by ', sprite);

            let mobType : number = this._getMobType(sprite);

            this.playerDeathCountForType[this._getMobKeyForType(mobType)]++;

            this.playerDeathCount++;
        }

        private _getMobType(sprite : Sprite) : number {

            let type : number = blockTypeEnum.UNKNOWN_TYPE;

            if (sprite instanceof Notch) {
                type = blockTypeEnum.MOB_NOTCH;
            }
            else if (sprite instanceof Meteor) {
                type = blockTypeEnum.MOB_METEOR;

            }
            else if (sprite instanceof Invader) {
                type = blockTypeEnum.MOB_INVADER;
            }
            else if (sprite instanceof Generator.Block) { //CHANGE ME!!
                type = blockTypeEnum.PLATFORM_TYPE
            }
            else {
                type = blockTypeEnum.MOB_MEGA_HEAD;
            }

            return type;
        }

        private _getMobKeyForType(type : number) : string {
            let mobClass : string = 'UNKNOWN_MOB';

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
                default:
                    break;
            }

            return mobClass;
        }

        public reset() {

            this.mobDeathCountForType.Notch = 0;
            this.mobDeathCountForType.Meteor = 0;
            this.mobDeathCountForType.Invader = 0;
            this.mobDeathCountForType.MegaHead = 0;

            this.playerDeathCountForType.Notch = 0;
            this.playerDeathCountForType.Meteor = 0;
            this.playerDeathCountForType.Invader = 0;
            this.playerDeathCountForType.MegaHead = 0;
            this.playerDeathCountForType.Platform = 0;

            this.playerDamageForMobType.Notch = 0;
            this.playerDamageForMobType.Meteor = 0;
            this.playerDamageForMobType.Invader = 0;
            this.playerDamageForMobType.MegaHead = 0;
            this.playerDamageForMobType.Platform = 0;


            this.playerDeathCount = 0;
            this.playerDamageReceivedCount = 0;
            this.mobDeathCount = 0;

            this.numberOfPlatformCollisions = 0;

        }
    }
}