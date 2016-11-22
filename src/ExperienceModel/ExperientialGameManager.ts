namespace PCGGame {
    import blockTypeEnum = Generator.blockTypeEnum;

    export class ExperientialGameManager {
        public static _instance : ExperientialGameManager = null;
        public static INTERVAL_MS : number = 1000 * 30;
        public static MIN_SURVEY_TIME_INTERVAL_MS : number = 1000 * 30;
        public static IS_EXPERIENCE_MODEL_ENABLED : boolean = true;

        public static gameMetricSnapShots : any = {
            overall: null,
            previous: null,
            current: null
        };

        public lastPlayerDeathDeltaTimeMS : number = 0;
        public lastPlayerDamagedDeltaTimeMS : number = 0;
        public lastSurveyShownTimeMS : number = 0;
        public surveyManager : SurveyManager = null;
        public isEligibleForSurvey : boolean = false;

        private _game : Phaser.Game = null;
        private _totalTimeElapsed : number = 0;
        private _currentSnapShotTime : number = 0;
        private _adaptTimeElapsedMS : number = 0;
        private _player : Player = null;
        private _randomGenerator : Phaser.RandomDataGenerator;
        private _currentSnapShot : GameMetric = null;

        private _mobGenerationEnabled : boolean = true;
        private _platformGenerationEnabled : boolean = true;
        private _maxMobAllowed : number = blockTypeEnum.MOB_METEOR;

        private _probabilityDistributions : any = {
            LOOT: [
                56, // DEFAULT
                20, // WEAPON
                20, // SHIELD
                2,  // MYSTERY_LOOT
                2   // NEW_LIFE
            ],
            PLATFORM: [
                25, // PLATFORM_TYPE
                25, // PUSH_PLATFORM_TYPE
                50  // MOB_NULL
            ],
            MOB: [
                50, // NULL_MOB: 20,
                30, // NOTCH: 25,
                20, // METEOR: 20,
                0, // INVADER: 20,
                0  // MEGAHEAD: 15
            ]
        };

        private _probabilityDistributionBoundaries : any = {
            LOOT: [0, 0, 0, 0, 0],
            PLATFORM: [0, 0, 0],
            MOB: [0, 0, 0, 0, 0]
        };

        private _cachedProbabilityFunctions : any  = {
            LOOT: null,
            PLATFORM: null,
            MOB: null
        };

        private _mobDifficultyLevel : number = 0;

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
                MIN_DISTANCE: 3,
                MAX_DISTANCE: 6,
                NEW_PATTERN_REPEAT_LENGTH: 2,
                NEW_PATTERN_COMPOSITION_PERCENTAGE: 50,
                GENERATE_BLOCK_THRESHOLD: 10
            },
            MOBS: {
                MIN_MOB_TYPE: Generator.blockTypeEnum.MOB_NULL,
                MAX_MOB_TYPE: Generator.blockTypeEnum.MOB_NOTCH,
                MIN_X_DISTANCE: 1,
                MAX_X_DISTANCE: 5,
                MIN_Y_DISTANCE: 2,
                MAX_Y_DISTANCE: 19
            }
        };


        /*
        * X = 32
        * Y = 24
        * */
        public mobTransitionTimelineAdaptationQueue : any = [];


        public constructor(game: Phaser.Game, player: Player) {
            this._game = game;
            this._player = player;
            this._randomGenerator = game.rnd;

            this.surveyManager = new SurveyManager('experience-survey');

            this.surveyManager.modalEvent.add((event : any) => {

                // start counting the delta time for the next survey interval after closing
                if (! event.isOpen) {
                    this.isEligibleForSurvey = false;
                }

            });

            ExperientialGameManager.gameMetricSnapShots.current = new GameMetric();
            ExperientialGameManager.gameMetricSnapShots.overall = new GameMetric();


            this._currentSnapShot = ExperientialGameManager.gameMetricSnapShots.current;

            for (let probType in this._probabilityDistributions) {
                if (this._probabilityDistributions.hasOwnProperty(probType)) {
                    this._updateProbabilityBoundaries(probType);
                }
            }

            this.calculateGridSpace();

            this.addAdaptationToQueue(5000, () => {
                this._mobGenerationEnabled = true;
            });


            this.addAdaptationToQueue(2500, () => {
                this.generatorParameters.PLATFORM.MIN_DISTANCE = 8;
                this.generatorParameters.PLATFORM.MAX_DISTANCE = 10;
            });

            this.addAdaptationToQueue(5000, () => {
                this.generatorParameters.MOBS.MIN_X_DISTANCE = 5;
                this.generatorParameters.MOBS.MAX_X_DISTANCE = 10;
                this._maxMobAllowed++;
                this._updateMobDistribution([30, 25, 25, 20]);
            });

            this.addAdaptationToQueue(15000, () => {
                this._maxMobAllowed++;
                this._updateMobDistribution([15, 25, 20, 20, 20]);
            });


           /* this.addAdaptationToQueue(15000, () => {
                this._mobDifficultyLevel += 5;
            });*/




        }

        //
        public showSurvey() {
            if (this.isEligibleForSurvey) {
                this.surveyManager.showSurvey();
            }
        }

        //
        private _updateProbabilityBoundaries(probabilityType : string) : any[] {
            let len = this._probabilityDistributionBoundaries[probabilityType].length;

            for (let i = 0; i < len; i++) {

                if (i === 0) {
                    this._probabilityDistributionBoundaries[probabilityType][i] = this._probabilityDistributions[probabilityType][i];
                }
                else if (this._probabilityDistributionBoundaries[probabilityType][i - 1] < 100){
                    this._probabilityDistributionBoundaries[probabilityType][i] = this._probabilityDistributionBoundaries[probabilityType][i - 1] + this._probabilityDistributions[probabilityType][i];
                }
                else {
                    this._probabilityDistributionBoundaries[probabilityType][i] = Number.POSITIVE_INFINITY;
                }
            }

            console.log(this._probabilityDistributionBoundaries[probabilityType]);

            return this._probabilityDistributionBoundaries[probabilityType];
        }

        //
        private calcType(minType : number, maxType: number, typeProbabilitiesUpperBoundary : any[]) : number {
            let p = this._randomGenerator.integerInRange(0, 100);
            let type = minType;

            console.log(p, typeProbabilitiesUpperBoundary, type, maxType);

            for (let i = minType; i <= maxType; i++) {
                console.log(typeProbabilitiesUpperBoundary[i]);
                if (p <= typeProbabilitiesUpperBoundary[i]) {
                    type = i;
                    break;
                }
            }

            return type;

        }

        //
        private  _distributionCalcFn(minType : number, maxType: number, type: string) : Function {

            let typeProbabilitiesUpperBoundary = this._probabilityDistributionBoundaries[type];

            if (this._cachedProbabilityFunctions[type]) {
                return this._cachedProbabilityFunctions[type];
            }

            this._cachedProbabilityFunctions[type] = () => {
                let mobType = this.calcType(minType, maxType, typeProbabilitiesUpperBoundary);
                console.log('Type generated value = ', mobType, ' for type ', type);
                return mobType;
            };

            return this._cachedProbabilityFunctions[type];
        }

        //
        public get lootDistributionFn() : Function {
            return this._distributionCalcFn(lootTypeEnum.DEFAULT, lootTypeEnum.NEW_LIFE, 'LOOT');
        }

        //
        public get platformDistributionFn() : Function {
            return this._distributionCalcFn(blockTypeEnum.PLATFORM_TYPE, blockTypeEnum.MOB_NULL, 'PLATFORM');
            //() => this._randomGenerator.integerInRange(blockTypeEnum.PLATFORM_TYPE, blockTypeEnum.MOB_NULL);
        }

        //
        public get mobDistributionFn() : Function {
            return this._distributionCalcFn(blockTypeEnum.MOB_NULL - 2, this._maxMobAllowed - 2, 'MOB');
        }

        private _setProbabilityDistributions(type: string, distributionRange : any[]) {

            this._cachedProbabilityFunctions[type] = null;
            this._probabilityDistributions[type] = distributionRange;
            this._updateProbabilityBoundaries(type);

        }

        private _updateLootDistribution(distributionRange : any[]) {
           this._setProbabilityDistributions('LOOT', distributionRange);
        }

        private _updateMobDistribution(distributionRange : any[]) {
            this._setProbabilityDistributions('MOB', distributionRange);
        }

        private _updatePlatformDistribution(distributionRange : any[]) {
            this._setProbabilityDistributions('PLATFORM', distributionRange);
        }



        public static instance(game?: Phaser.Game, player?: Player) : ExperientialGameManager {

            if (ExperientialGameManager._instance === null && game && player) {
                ExperientialGameManager._instance = new ExperientialGameManager(game, player);
            }

            return ExperientialGameManager._instance;
        }

        public get mobDifficultyLevel() : number {
            return this._mobDifficultyLevel;
        }

        public calculateGridSpace() {
            this.generatorParameters.GRID.X_TOTAL = this._game.width / Generator.Parameters.GRID.CELL.SIZE;
            this.generatorParameters.GRID.Y_TOTAL = this._game.height / Generator.Parameters.GRID.CELL.SIZE;
        }

        public evaluateLootAndInterveneIfDanger(loot: Loot) : number {

            if (! this._player.isInDanger()) {

                if (loot.type === lootTypeEnum.MYSTERY_LOOT && loot.subType) {
                    loot.subType = this.lootDistributionFn.call(this);
                }

                return loot.type;
            }

            loot.type = lootTypeEnum.MYSTERY_LOOT;
            loot.subType = this._randomGenerator.integerInRange(0, 100) >= 40 ? lootTypeEnum.NEW_LIFE : lootTypeEnum.SHIELD;


            return loot.type;
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

            ExperientialGameManager.gameMetricSnapShots.overall.mergeStats(this._currentSnapShot);
            ExperientialGameManager.gameMetricSnapShots.previous = ExperientialGameManager.gameMetricSnapShots.current;

            ExperientialGameManager.gameMetricSnapShots.current = new GameMetric();
            this._currentSnapShot = ExperientialGameManager.gameMetricSnapShots.current;

            console.warn(ExperientialGameManager.gameMetricSnapShots);
        }


        // UPDATE!!
        public update() {

            let lastTime = this._game.time.elapsedMS;
            this._currentSnapShotTime += lastTime;
            this._adaptTimeElapsedMS += lastTime;

            this.lastPlayerDeathDeltaTimeMS += lastTime;
            this.lastPlayerDamagedDeltaTimeMS += lastTime;



            if (this.hasAdapatationsInQueue() && this._adaptTimeElapsedMS >= this.mobTransitionTimelineAdaptationQueue[0].deltaMS) {
                let adaptationToMake = this.getNextAdaptationInQueue();

                adaptationToMake.f.call(this);

                this._adaptTimeElapsedMS -= adaptationToMake.deltaMS;
            }


            if (this._currentSnapShotTime >= ExperientialGameManager.INTERVAL_MS) {
                this.takeMetricSnapShot();
                this._currentSnapShotTime -= ExperientialGameManager.INTERVAL_MS;
            }

            if (ExperientialGameManager.IS_EXPERIENCE_MODEL_ENABLED && ! this.isEligibleForSurvey) {

                this.lastSurveyShownTimeMS += lastTime;

                if (this.lastSurveyShownTimeMS >= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS) {
                    this.isEligibleForSurvey = true;
                    this.lastSurveyShownTimeMS -= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS
                }
            }

            this._totalTimeElapsed += lastTime;

        }


        public playerDamageReceived(damage: number, sprite : Sprite) {
            this._currentSnapShot.playerDamagedBy(sprite, damage);
            this.lastPlayerDamagedDeltaTimeMS = 0;
        }

        public playerDamageGiven(damage: number, sprite: Sprite) {
            this._currentSnapShot.mobDamagedReceieved(sprite, damage);
        }

        public playerKilled(sprite: Sprite) {
            this._currentSnapShot.playerKilledBy(sprite);
            this.lastPlayerDeathDeltaTimeMS = 0;
        }

        public playerCollidedWithPlatform() {
            this._currentSnapShot.numberOfPlatformCollisions++;
        }

        public mobKilled(mob: Sprite) {
            this._currentSnapShot.mobKilled(mob);
        }

    }
}