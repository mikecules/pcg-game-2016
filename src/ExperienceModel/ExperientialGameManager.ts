namespace PCGGame {
    import blockTypeEnum = Generator.blockTypeEnum;

    interface Strategy {
        isViable: boolean;
        strategyFunction : Function;
    }

    export class ExperientialGameManager {
        public static _instance : ExperientialGameManager = null;
        public static INTERVAL_MS : number = 1000 * 15; //30;
        public static MIN_SURVEY_TIME_INTERVAL_MS : number = 1000 * 30;
        public static IS_EXPERIENCE_MODEL_ENABLED : boolean = true;//false;
        //public static IS_EXPERIENCE_MODEL_ENABLED : boolean = false;
        public static MAX_MOB_DIFFICULTY_LEVEL : number = 10;

        public static INCREASE_PLAYER_DIFFICULTY_MAX_NON_DEATH_DURATION = 60 * 1000; // 1 minute
        public static DIFFICULTY_DENSITY_PERCENT_INCREMENT = 5;//10; // 5
        public static PLAYER_AVERAGE_HEALTH_THRESHOLD = 70; // if player is above this increment the difficulty



        public static gameMetricSnapShots : any = {
            overall: null,
            previous: null,
            current: null
        };

        public lastSurveyShownTimeMS : number = 0;
        public surveyManager : SurveyManager = null;
        public isEligibleForSurvey : boolean = false;

        private _game : Phaser.Game = null;
        private _currentSnapShotTime : number = 0;
        private _adaptTimeElapsedMS : number = 0;
        private _player : Player = null;
        private _randomGenerator : Phaser.RandomDataGenerator;
        private _currentSnapShot : GameMetric = null;
        private _overallSnapShot : GameMetric = null;

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
                MAX_LENGTH: 3, //5
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
            this._overallSnapShot = ExperientialGameManager.gameMetricSnapShots.overall;

            for (let probType in this._probabilityDistributions) {
                if (this._probabilityDistributions.hasOwnProperty(probType)) {
                    this._updateProbabilityBoundaries(probType);
                }
            }

            this.calculateGridSpace();

            this.addAdaptationToQueue(5000, () => {
                this._mobGenerationEnabled = true;
            });


            /*this.addAdaptationToQueue(2500, () => {
                this.generatorParameters.PLATFORM.MIN_DISTANCE = 8;
                this.generatorParameters.PLATFORM.MAX_DISTANCE = 10;
            });*/

            this.addAdaptationToQueue(5000, () => {
                //this.generatorParameters.MOBS.MIN_X_DISTANCE = 5;
                //this.generatorParameters.MOBS.MAX_X_DISTANCE = 10;
                this._maxMobAllowed++;
                this._updateMobDistribution([35, 25, 20, 20, 0]);
            });

            this.addAdaptationToQueue(5000, () => {
                this._maxMobAllowed++;
                this._updateMobDistribution([35, 25, 10, 10, 20]);
            });



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

            let prevProb = 0;

            for (let i = 0; i < len; i++) {

                if (i === 0) {
                    this._probabilityDistributionBoundaries[probabilityType][i] = this._probabilityDistributions[probabilityType][i];
                }
                else if (prevProb >= 0 && prevProb < 100 && this._probabilityDistributions[probabilityType][i] > 0){
                    this._probabilityDistributionBoundaries[probabilityType][i] = prevProb + this._probabilityDistributions[probabilityType][i];
                }
                else {
                    this._probabilityDistributionBoundaries[probabilityType][i] = Number.NEGATIVE_INFINITY;
                }


                if (this._probabilityDistributions[probabilityType][i] >= 0) {
                    prevProb = this._probabilityDistributionBoundaries[probabilityType][i];
                }
            }

            console.warn(probabilityType, ' Distribution: ', this._probabilityDistributionBoundaries[probabilityType]);

            return this._probabilityDistributionBoundaries[probabilityType];
        }

        //
        private calcType(minType : number, maxType: number, typeProbabilitiesUpperBoundary : any[]) : number {
            let p = this._randomGenerator.integerInRange(1, 100);
            let type = minType;

            console.warn(`Probability Chosen: ${p}, Type Boundary ${typeProbabilitiesUpperBoundary} for type ${type} and ${maxType}`);

            for (let i = minType; i <= maxType; i++) {
                //console.log(typeProbabilitiesUpperBoundary[i]);

                if (typeProbabilitiesUpperBoundary[i] === Number.NEGATIVE_INFINITY) {
                    continue;
                }

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

                    if (loot.subType === lootTypeEnum.MYSTERY_LOOT) {
                        loot.subType = lootTypeEnum.DEFAULT;
                    }
                }

                return loot.type;
            }

            loot.type = lootTypeEnum.MYSTERY_LOOT;
            loot.subType = this._randomGenerator.integerInRange(1, 10) >= 6 ? lootTypeEnum.NEW_LIFE : lootTypeEnum.SHIELD;


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

        private _shouldIncreaseDifficulty() : boolean {

            let previousGameMetricSnapshot = ExperientialGameManager.gameMetricSnapShots.previous;
            let shouldIncreaseDifficulty : boolean = false;

            if (! previousGameMetricSnapshot) {
                return shouldIncreaseDifficulty;
            }

            let currentGameMetricSnapshot = this._currentSnapShot;
            let overallGameMetricSnapshot = this._overallSnapShot;



            shouldIncreaseDifficulty = shouldIncreaseDifficulty || overallGameMetricSnapshot.lastPlayerDeathTimeMS > ExperientialGameManager.INCREASE_PLAYER_DIFFICULTY_MAX_NON_DEATH_DURATION;
            shouldIncreaseDifficulty = shouldIncreaseDifficulty || (currentGameMetricSnapshot.averagePlayerHealth() > ExperientialGameManager.PLAYER_AVERAGE_HEALTH_THRESHOLD &&
                previousGameMetricSnapshot.averagePlayerHealth() > ExperientialGameManager.PLAYER_AVERAGE_HEALTH_THRESHOLD);

            shouldIncreaseDifficulty = shouldIncreaseDifficulty || (currentGameMetricSnapshot.playerDamageReceivedCount < previousGameMetricSnapshot.playerDamageReceivedCount);


            return shouldIncreaseDifficulty;
        }

        public evaluateDifficultyAndCreateStrategy () {

            if (this._shouldIncreaseDifficulty()) {

                let strategies : Strategy[] = [this._increaseMobDifficultyStrategyFn(), this._increasePlatformConcentrationStrategyFn(), this._increaseMobEnemyConcentrationStrategy()];



                let leftOverStrategies : any[] = strategies.filter((fn : Strategy) => fn.isViable);

                if (leftOverStrategies.length) {

                    let execIndex = this._randomGenerator.integerInRange(0, leftOverStrategies.length - 1);
                    leftOverStrategies[execIndex].strategyFunction.call(this);
                    console.warn('!!!!!!!!!!!!!!!!!!! DIFFICULTY INCREASED!!!');
                }


            }

        }

        public evaluateDifficultyWithPlayerModelAndCreateStrategy() {

            if (this._shouldIncreaseDifficulty()) {

                let mobDifficultyStrategy : Strategy = this._increaseMobDifficultyStrategyFn();

                if (mobDifficultyStrategy.isViable) {
                    mobDifficultyStrategy.strategyFunction.call(this);
                    console.warn('!!!!!!!!!!!!!!!!!!! EXPERIENTIAL MODEL DIFFICULTY INCREASED!!!');
                }
            }

        }

        public takeMetricSnapShot() {

            if (! ExperientialGameManager.IS_EXPERIENCE_MODEL_ENABLED) {
                this.evaluateDifficultyAndCreateStrategy();
            }
            else {
                this.evaluateDifficultyWithPlayerModelAndCreateStrategy();
            }

            ExperientialGameManager.gameMetricSnapShots.previous = ExperientialGameManager.gameMetricSnapShots.current;
            ExperientialGameManager.gameMetricSnapShots.current = new GameMetric();
            this._currentSnapShot = ExperientialGameManager.gameMetricSnapShots.current;



            console.warn(ExperientialGameManager.gameMetricSnapShots);
        }


        // UPDATE!!
        public update() {

            let lastTimeMS = this._game.time.elapsedMS;
            this._currentSnapShotTime += lastTimeMS;
            this._adaptTimeElapsedMS += lastTimeMS;


            this._currentSnapShot.tick(lastTimeMS, this._player.health);
            this._overallSnapShot.tick(lastTimeMS, this._player.health);

            console.warn(this._currentSnapShot.averagePlayerHealth());


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

                this.lastSurveyShownTimeMS += lastTimeMS;

                if (this.lastSurveyShownTimeMS >= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS) {
                    this.isEligibleForSurvey = true;
                    this.lastSurveyShownTimeMS -= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS
                }
            }

        }


        public playerDamageReceived(damage: number, sprite : Sprite) {
            this._currentSnapShot.playerDamagedBy(sprite, damage);
            this._overallSnapShot.playerDamagedBy(sprite, damage)
        }

        public playerDamageGiven(damage: number, sprite: Sprite) {
            this._currentSnapShot.mobDamagedReceieved(sprite, damage);
            this._overallSnapShot.mobDamagedReceieved(sprite, damage);
        }

        public playerKilled(sprite: Sprite) {
            this._currentSnapShot.playerKilledBy(sprite);
            this._overallSnapShot.playerKilledBy(sprite);
            this._currentSnapShotTime = 0;
            this.takeMetricSnapShot();
        }

        public playerCollidedWithPlatform() {
            this._currentSnapShot.numberOfPlatformCollisions++;
            this._overallSnapShot.numberOfPlatformCollisions++;
        }

        public mobKilled(mob: Sprite) {
            this._currentSnapShot.mobKilled(mob);
            this._overallSnapShot.mobKilled(mob);
        }



        /*
         PLATFORM: [
            PLATFORM_TYPE
            PUSH_PLATFORM_TYPE
            MOB_NULL
         ]

         MOB: [
            NULL_MOB
            NOTCH
            METEOR
            INVADER
            MEGAHEAD
         ]
         */
        private _reallocateProbFromNullSpace(mobType : string, deltaProbDistribution : number[], nullOverflow : boolean = true) {

            let sumFn : Function = (total: number, num: number) : number => total + ((Number.NEGATIVE_INFINITY === num) ? 0 : num);
            let overflowIndex = -1;

            let overFlowAmount = deltaProbDistribution.reduce(sumFn, 0);

            if (overFlowAmount !== 0 && nullOverflow) {
                overflowIndex = this._getMobNullIndexForType(mobType);

                let previousOverflowVal = this._probabilityDistributions[mobType][overflowIndex];

                this._probabilityDistributions[mobType][overflowIndex] = (this._probabilityDistributions[mobType][overflowIndex] === Number.NEGATIVE_INFINITY) ? 0 : this._probabilityDistributions[mobType][overflowIndex];
                this._probabilityDistributions[mobType][overflowIndex] -= overFlowAmount;


                if (this._probabilityDistributions[mobType][overflowIndex] < 0) {
                    console.error(`Cannot adjust probability distribution for type ${mobType} by the increments ${deltaProbDistribution} it would be ${this._probabilityDistributions[mobType]}.`);
                    this._probabilityDistributions[mobType][overflowIndex] = previousOverflowVal;
                    return;
                }


            }
            else if (nullOverflow && overFlowAmount !== 0) {
                console.error(`Cannot adjust probability distribution for type ${mobType} by the increments ${deltaProbDistribution} no overflow specified.`);
            }

            for (let i = 0; i < deltaProbDistribution.length; i++) {

                if (i === overflowIndex) {
                    continue;
                }

                this._probabilityDistributions[mobType][i] = Math.max(0, deltaProbDistribution[i] + this._probabilityDistributions[mobType][i]);
            }


            let remainder = 100 - this._probabilityDistributions[mobType].reduce(sumFn, 0);

            if (remainder !== 0 && (this._probabilityDistributions[mobType][overflowIndex] + remainder) >= 0) {
                this._probabilityDistributions[mobType][overflowIndex] += remainder;
                console.error(`adding ${remainder} overflow now ${this._probabilityDistributions[mobType][overflowIndex]}`);
            }
            else if (remainder !== 0) {
                console.error(`Cannot adjust probability distribution for type ${mobType} by the increments ${deltaProbDistribution} adds up to more or less than 100!.`)
            }


            console.warn(`Probability Distribution recalc = ${this._probabilityDistributions[mobType]}`);

            this._cachedProbabilityFunctions[mobType] = null;
            this._updateProbabilityBoundaries(mobType);

        }

        private _getMobNullIndexForType(type : string) : number {
            let index : number = -1;

            switch(type) {
                case 'MOB':
                    index = 0;
                    break;
                case 'PLATFORM':
                    index = 2;
                    break;
                default:
                    break;
            }

            return index;
        }


        private _increaseMobDifficultyStrategyFn() : Strategy {

            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            if ((this._mobDifficultyLevel + 1) > ExperientialGameManager.MAX_MOB_DIFFICULTY_LEVEL) {
                strategy.isViable = false;
                return strategy;
            }

            strategy.strategyFunction = () => {
                console.warn('_increaseMobDifficultyStrategyFn');
                return ++this._mobDifficultyLevel;
            };

            return strategy;
        }



        private _decreaseMobDifficultyStrategyFn() : Strategy {
            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            if ((this._mobDifficultyLevel - 1) < 0) {
                strategy.isViable = false;
                return strategy;
            }

            strategy.strategyFunction = () => {
                console.warn('_decreaseMobDifficultyStrategyFn');
                return --this._mobDifficultyLevel;
            };

            return strategy;
        }

        /*
          [
         PLATFORM_TYPE
         PUSH_PLATFORM_TYPE
         MOB_NULL
         ]
         */

        private _increasePlatformConcentrationStrategyFn() : Strategy {
            let type : string = 'PLATFORM';
            let nullSpacePercentage : number = this._probabilityDistributions[type][this._getMobNullIndexForType(type)];
            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            if (nullSpacePercentage <= 0) {
                strategy.isViable = false;
                return strategy;
            }


            let maxPercent = Math.min(nullSpacePercentage, ExperientialGameManager.DIFFICULTY_DENSITY_PERCENT_INCREMENT);

            let pushPlatformProb  = this._randomGenerator.integerInRange(0, maxPercent);
            let platformProb = maxPercent - pushPlatformProb;

            strategy.strategyFunction = () => {
                console.warn('_increasePlatformConcentrationStrategyFn');
                return this._reallocateProbFromNullSpace(type, [platformProb, pushPlatformProb]);
            };

            return strategy;
        }


        private _decreasePlatformConcentrationStrategy() : Strategy {


            let type : string = 'PLATFORM';
            let halfDec : number = ExperientialGameManager.DIFFICULTY_DENSITY_PERCENT_INCREMENT / 2;
            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            let platformPercentage : number = this._probabilityDistributions[type][0];
            let pushPlatformPercentage : number = this._probabilityDistributions[type][1];

            if ((pushPlatformPercentage - halfDec) < 0 || (platformPercentage - halfDec) < 0) {
                console.warn('Cannot reduce likelihood of platform spawn more than 0!');
                strategy.isViable = false;

                return strategy;
            }


            strategy.strategyFunction = () => {
                console.warn('_decreasePlatformConcentrationStrategy');
                return this._reallocateProbFromNullSpace(type, [-halfDec, -halfDec, (halfDec + halfDec)], false);
            };

            return strategy;

        }

        /*
        *   NULL_MOB
         NOTCH
         METEOR
         INVADER
         MEGAHEAD
        * */

        private _increaseMobEnemyConcentrationStrategy() : Strategy {


            let type : string = 'MOB';
            let nullSpacePercentage : number = this._probabilityDistributions[type][this._getMobNullIndexForType(type)];
            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            if (nullSpacePercentage <= 0) {
                strategy.isViable = false;
                return strategy;
            }

            let maxPercent = Math.min(nullSpacePercentage, ExperientialGameManager.DIFFICULTY_DENSITY_PERCENT_INCREMENT);

            let megaHeadProb  = this._randomGenerator.integerInRange(Math.round(maxPercent / 2), maxPercent);
            let invaderProb = maxPercent - megaHeadProb;

            strategy.strategyFunction = () => {
                console.warn('_increaseMobEnemyConcentrationStrategy');
                return this._reallocateProbFromNullSpace(type, [0, 0, 0, invaderProb, megaHeadProb]);
            };

            return strategy;
        }

        private _decreaseMobEnemyConcentrationStrategy() : Strategy {


            let type : string = 'MOB';
            let halfDec : number = ExperientialGameManager.DIFFICULTY_DENSITY_PERCENT_INCREMENT / 2;
            let strategy : Strategy = {isViable: true, strategyFunction: () => {}};

            let invaderAvailPercentage : number = this._probabilityDistributions[type][3];
            let megaHeadAvailPercentage : number = this._probabilityDistributions[type][4];

            if ((invaderAvailPercentage - halfDec) < 0 || (megaHeadAvailPercentage - halfDec) < 0) {
                console.warn('Cannot reduce likelihood of mob spawn more than 0!');
                strategy.isViable = false;

                return strategy;
            }


            strategy.strategyFunction = () => {
                console.warn('_decreaseMobEnemyConcentrationStrategy');
                return this._reallocateProbFromNullSpace(type, [(halfDec + halfDec), 0, 0, -halfDec, -halfDec], false);
            };

            return strategy;

        }

    }
}