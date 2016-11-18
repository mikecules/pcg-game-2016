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
        private _adaptTimeElapsedMS : number = 0;

        private _mobGenerationEnabled : boolean = true;
        private _platformGenerationEnabled : boolean = true;

        private _lootProbabilityDist : any = {

    };

        /*public generatorParameters : any = {
            PLATFORM: {
                MIN_LENGTH: 1,
                MAX_LENGTH: 5,
                MIN_DISTANCE: 5,
                MAX_DISTANCE: 10,
                NEW_PATTERN_REPEAT_LENGTH: 2,
                NEW_PATTERN_COMPOSITION_PERCENTAGE: 50,
                GENERATE_BLOCK_THRESHOLD: 50
            },
            MOBS: {

            }
        };*/

        public generatorParameters : any = {
            GRID: {
                X_TOTAL: 0,
                Y_TOTAL: 0
            },
            PLATFORM: {
                MIN_LENGTH: 1,
                MAX_LENGTH: 5,
                MIN_DISTANCE: 5,
                MAX_DISTANCE: 10,
                NEW_PATTERN_REPEAT_LENGTH: 2,
                NEW_PATTERN_COMPOSITION_PERCENTAGE: 50,
                GENERATE_BLOCK_THRESHOLD: 10
            },
            MOBS: {
                MIN_MOB_TYPE: Generator.blockTypeEnum.MOB_NOTCH,
                MAX_MOB_TYPE: Generator.blockTypeEnum.MOB_NOTCH,
                MIN_X_DISTANCE: 1,
                MAX_X_DISTANCE: 5,
                MIN_Y_DISTANCE: 1,
                MAX_Y_DISTANCE: 20
            }
        };

        /*
        * X = 32
        * Y = 24
        * */
        public mobTransitionTimelineAdaptationQueue : any = [];


        public constructor(game: Phaser.Game, player: Player) {
            this._game = game;

            this.calculateGridSpace();

            this.addAdaptationToQueue(5000, () => {
                this._mobGenerationEnabled = true;
                this.generatorParameters.MOBS.MAX_MOB_TYPE = Generator.blockTypeEnum.MOB_METEOR;
            });


            this.addAdaptationToQueue(2500, () => {
                this.generatorParameters.PLATFORM.MIN_DISTANCE = 8;
                this.generatorParameters.PLATFORM.MAX_DISTANCE = 10;
            });

            this.addAdaptationToQueue(5000, () => {
                this.generatorParameters.MOBS.MIN_X_DISTANCE = 5;
                this.generatorParameters.MOBS.MAX_X_DISTANCE = 10;
                this.generatorParameters.MOBS.MAX_MOB_TYPE = Generator.blockTypeEnum.MOB_INVADER;
            });

        }



        public static instance(game?: Phaser.Game, player?: Player) : ExperientialGameManager {

            if (ExperientialGameManager._instance === null && game && player) {
                ExperientialGameManager._instance = new ExperientialGameManager(game, player);
            }

            return ExperientialGameManager._instance;
        }

        public calculateGridSpace() {
            this.generatorParameters.GRID.X_TOTAL = this._game.width / Generator.Parameters.GRID.CELL.SIZE;
            this.generatorParameters.GRID.Y_TOTAL = this._game.height / Generator.Parameters.GRID.CELL.SIZE;
        }


        public addAdaptationToQueue(msInFuture: number, adaptationFunction: Function) {
            this.mobTransitionTimelineAdaptationQueue.push(
                {
                    deltaMS: msInFuture,
                    f: adaptationFunction
                }
            );
        }

        public getNextAdaptationInQueue() {
            if (this.hasAdapatationsInQueue()) {
                return this.mobTransitionTimelineAdaptationQueue.shift();
            }
        }

        public hasAdapatationsInQueue() {
            return  this.mobTransitionTimelineAdaptationQueue.length > 0;
        }

        public get isMobGenerationEnabled() : boolean {
            return this._mobGenerationEnabled;
        }


        public get isPlatformGenerationEnabled() : boolean {
            return this._platformGenerationEnabled;
        }

        public takeMetricSnapShot() {
            console.warn(this._gameMetricSnapShots.current);
        }


        public update() {

            let lastTime = this._game.time.elapsedMS;
            this._currentSnapShotTime += lastTime;
            this._adaptTimeElapsedMS += lastTime;


            if (this.mobTransitionTimelineAdaptationQueue.length && this._adaptTimeElapsedMS >= this.mobTransitionTimelineAdaptationQueue[0].deltaMS) {
                let adaptationToMake = this.getNextAdaptationInQueue();
                console.log(adaptationToMake);
                    adaptationToMake.f.call(this);

                this._adaptTimeElapsedMS = this._adaptTimeElapsedMS - adaptationToMake - adaptationToMake.deltaMS;
            }


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
            'MegaHead': 0,
            'Platform': 0
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
            return Generator.Block.getMobEnumType(sprite);
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
            this.mobDeathCountForType.Platform = 0;

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