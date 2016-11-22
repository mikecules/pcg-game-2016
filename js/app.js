var PCGGame;
(function (PCGGame) {
    var Global = (function () {
        function Global() {
        }
        Global.SCREEN = {
            WIDTH: 1024,
            HEIGHT: 640
        };
        return Global;
    }());
    PCGGame.Global = Global;
})(PCGGame || (PCGGame = {}));
$(document).ready(function () {
    PCGGame.Global.game = new PCGGame.Game();
});
var PCGGame;
(function (PCGGame) {
    var ExperientialGameManager = (function () {
        function ExperientialGameManager(game, player) {
            var _this = this;
            this.lastPlayerDeathDeltaTimeMS = 0;
            this.lastPlayerDamagedDeltaTimeMS = 0;
            this.lastSurveyShownTimeMS = 0;
            this.surveyManager = null;
            this.isEligibleForSurvey = false;
            this._game = null;
            this._totalTimeElapsed = 0;
            this._currentSnapShotTime = 0;
            this._adaptTimeElapsedMS = 0;
            this._player = null;
            this._currentSnapShot = null;
            this._mobGenerationEnabled = true;
            this._platformGenerationEnabled = true;
            this._maxMobAllowed = 4;
            this._probabilityDistributions = {
                LOOT: [
                    56,
                    20,
                    20,
                    2,
                    2
                ],
                PLATFORM: [
                    25,
                    25,
                    50
                ],
                MOB: [
                    50,
                    30,
                    20,
                    0,
                    0
                ]
            };
            this._probabilityDistributionBoundaries = {
                LOOT: [0, 0, 0, 0, 0],
                PLATFORM: [0, 0, 0],
                MOB: [0, 0, 0, 0, 0]
            };
            this._cachedProbabilityFunctions = {
                LOOT: null,
                PLATFORM: null,
                MOB: null
            };
            this._mobDifficultyLevel = 0;
            this.generatorParameters = {
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
                    MIN_MOB_TYPE: 2,
                    MAX_MOB_TYPE: 3,
                    MIN_X_DISTANCE: 1,
                    MAX_X_DISTANCE: 5,
                    MIN_Y_DISTANCE: 2,
                    MAX_Y_DISTANCE: 19
                }
            };
            this.mobTransitionTimelineAdaptationQueue = [];
            this._game = game;
            this._player = player;
            this._randomGenerator = game.rnd;
            this.surveyManager = new PCGGame.SurveyManager('experience-survey');
            this.surveyManager.modalEvent.add(function (event) {
                if (!event.isOpen) {
                    _this.isEligibleForSurvey = false;
                }
            });
            ExperientialGameManager.gameMetricSnapShots.current = new PCGGame.GameMetric();
            ExperientialGameManager.gameMetricSnapShots.overall = new PCGGame.GameMetric();
            this._currentSnapShot = ExperientialGameManager.gameMetricSnapShots.current;
            for (var probType in this._probabilityDistributions) {
                if (this._probabilityDistributions.hasOwnProperty(probType)) {
                    this._updateProbabilityBoundaries(probType);
                }
            }
            this.calculateGridSpace();
            this.addAdaptationToQueue(5000, function () {
                _this._mobGenerationEnabled = true;
            });
            this.addAdaptationToQueue(2500, function () {
                _this.generatorParameters.PLATFORM.MIN_DISTANCE = 8;
                _this.generatorParameters.PLATFORM.MAX_DISTANCE = 10;
            });
            this.addAdaptationToQueue(5000, function () {
                _this.generatorParameters.MOBS.MIN_X_DISTANCE = 5;
                _this.generatorParameters.MOBS.MAX_X_DISTANCE = 10;
                _this._maxMobAllowed++;
                _this._updateMobDistribution([30, 25, 25, 20]);
            });
            this.addAdaptationToQueue(15000, function () {
                _this._maxMobAllowed++;
                _this._updateMobDistribution([15, 25, 20, 20, 20]);
            });
        }
        ExperientialGameManager.prototype.showSurvey = function () {
            if (this.isEligibleForSurvey) {
                this.surveyManager.showSurvey();
            }
        };
        ExperientialGameManager.prototype._updateProbabilityBoundaries = function (probabilityType) {
            var len = this._probabilityDistributionBoundaries[probabilityType].length;
            for (var i = 0; i < len; i++) {
                if (i === 0) {
                    this._probabilityDistributionBoundaries[probabilityType][i] = this._probabilityDistributions[probabilityType][i];
                }
                else if (this._probabilityDistributionBoundaries[probabilityType][i - 1] < 100) {
                    this._probabilityDistributionBoundaries[probabilityType][i] = this._probabilityDistributionBoundaries[probabilityType][i - 1] + this._probabilityDistributions[probabilityType][i];
                }
                else {
                    this._probabilityDistributionBoundaries[probabilityType][i] = Number.POSITIVE_INFINITY;
                }
            }
            console.log(this._probabilityDistributionBoundaries[probabilityType]);
            return this._probabilityDistributionBoundaries[probabilityType];
        };
        ExperientialGameManager.prototype.calcType = function (minType, maxType, typeProbabilitiesUpperBoundary) {
            var p = this._randomGenerator.integerInRange(0, 100);
            var type = minType;
            console.log(p, typeProbabilitiesUpperBoundary, type, maxType);
            for (var i = minType; i <= maxType; i++) {
                console.log(typeProbabilitiesUpperBoundary[i]);
                if (p <= typeProbabilitiesUpperBoundary[i]) {
                    type = i;
                    break;
                }
            }
            return type;
        };
        ExperientialGameManager.prototype._distributionCalcFn = function (minType, maxType, type) {
            var _this = this;
            var typeProbabilitiesUpperBoundary = this._probabilityDistributionBoundaries[type];
            if (this._cachedProbabilityFunctions[type]) {
                return this._cachedProbabilityFunctions[type];
            }
            this._cachedProbabilityFunctions[type] = function () {
                var mobType = _this.calcType(minType, maxType, typeProbabilitiesUpperBoundary);
                console.log('Type generated value = ', mobType, ' for type ', type);
                return mobType;
            };
            return this._cachedProbabilityFunctions[type];
        };
        Object.defineProperty(ExperientialGameManager.prototype, "lootDistributionFn", {
            get: function () {
                return this._distributionCalcFn(0, 4, 'LOOT');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExperientialGameManager.prototype, "platformDistributionFn", {
            get: function () {
                return this._distributionCalcFn(0, 2, 'PLATFORM');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExperientialGameManager.prototype, "mobDistributionFn", {
            get: function () {
                return this._distributionCalcFn(2 - 2, this._maxMobAllowed - 2, 'MOB');
            },
            enumerable: true,
            configurable: true
        });
        ExperientialGameManager.prototype._setProbabilityDistributions = function (type, distributionRange) {
            this._cachedProbabilityFunctions[type] = null;
            this._probabilityDistributions[type] = distributionRange;
            this._updateProbabilityBoundaries(type);
        };
        ExperientialGameManager.prototype._updateLootDistribution = function (distributionRange) {
            this._setProbabilityDistributions('LOOT', distributionRange);
        };
        ExperientialGameManager.prototype._updateMobDistribution = function (distributionRange) {
            this._setProbabilityDistributions('MOB', distributionRange);
        };
        ExperientialGameManager.prototype._updatePlatformDistribution = function (distributionRange) {
            this._setProbabilityDistributions('PLATFORM', distributionRange);
        };
        ExperientialGameManager.instance = function (game, player) {
            if (ExperientialGameManager._instance === null && game && player) {
                ExperientialGameManager._instance = new ExperientialGameManager(game, player);
            }
            return ExperientialGameManager._instance;
        };
        Object.defineProperty(ExperientialGameManager.prototype, "mobDifficultyLevel", {
            get: function () {
                return this._mobDifficultyLevel;
            },
            enumerable: true,
            configurable: true
        });
        ExperientialGameManager.prototype.calculateGridSpace = function () {
            this.generatorParameters.GRID.X_TOTAL = this._game.width / Generator.Parameters.GRID.CELL.SIZE;
            this.generatorParameters.GRID.Y_TOTAL = this._game.height / Generator.Parameters.GRID.CELL.SIZE;
        };
        ExperientialGameManager.prototype.evaluateLootAndInterveneIfDanger = function (loot) {
            if (!this._player.isInDanger()) {
                if (loot.type === 3 && loot.subType) {
                    loot.subType = this.lootDistributionFn.call(this);
                }
                return loot.type;
            }
            loot.type = 3;
            loot.subType = this._randomGenerator.integerInRange(0, 100) >= 40 ? 4 : 2;
            return loot.type;
        };
        ExperientialGameManager.prototype.addAdaptationToQueue = function (msInFuture, adaptationFunction) {
            this.mobTransitionTimelineAdaptationQueue.push({
                deltaMS: msInFuture,
                f: adaptationFunction
            });
        };
        ExperientialGameManager.prototype.getNextAdaptationInQueue = function () {
            if (this.hasAdapatationsInQueue()) {
                return this.mobTransitionTimelineAdaptationQueue.shift();
            }
        };
        ExperientialGameManager.prototype.hasAdapatationsInQueue = function () {
            return this.mobTransitionTimelineAdaptationQueue.length > 0;
        };
        Object.defineProperty(ExperientialGameManager.prototype, "isMobGenerationEnabled", {
            get: function () {
                return this._mobGenerationEnabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExperientialGameManager.prototype, "isPlatformGenerationEnabled", {
            get: function () {
                return this._platformGenerationEnabled;
            },
            enumerable: true,
            configurable: true
        });
        ExperientialGameManager.prototype.takeMetricSnapShot = function () {
            ExperientialGameManager.gameMetricSnapShots.overall.mergeStats(this._currentSnapShot);
            ExperientialGameManager.gameMetricSnapShots.previous = ExperientialGameManager.gameMetricSnapShots.current;
            ExperientialGameManager.gameMetricSnapShots.current = new PCGGame.GameMetric();
            this._currentSnapShot = ExperientialGameManager.gameMetricSnapShots.current;
            console.warn(ExperientialGameManager.gameMetricSnapShots);
        };
        ExperientialGameManager.prototype.update = function () {
            var lastTime = this._game.time.elapsedMS;
            this._currentSnapShotTime += lastTime;
            this._adaptTimeElapsedMS += lastTime;
            this.lastPlayerDeathDeltaTimeMS += lastTime;
            this.lastPlayerDamagedDeltaTimeMS += lastTime;
            if (this.hasAdapatationsInQueue() && this._adaptTimeElapsedMS >= this.mobTransitionTimelineAdaptationQueue[0].deltaMS) {
                var adaptationToMake = this.getNextAdaptationInQueue();
                adaptationToMake.f.call(this);
                this._adaptTimeElapsedMS -= adaptationToMake.deltaMS;
            }
            if (this._currentSnapShotTime >= ExperientialGameManager.INTERVAL_MS) {
                this.takeMetricSnapShot();
                this._currentSnapShotTime -= ExperientialGameManager.INTERVAL_MS;
            }
            if (ExperientialGameManager.IS_EXPERIENCE_MODEL_ENABLED && !this.isEligibleForSurvey) {
                this.lastSurveyShownTimeMS += lastTime;
                if (this.lastSurveyShownTimeMS >= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS) {
                    this.isEligibleForSurvey = true;
                    this.lastSurveyShownTimeMS -= ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS;
                }
            }
            this._totalTimeElapsed += lastTime;
        };
        ExperientialGameManager.prototype.playerDamageReceived = function (damage, sprite) {
            this._currentSnapShot.playerDamagedBy(sprite, damage);
            this.lastPlayerDamagedDeltaTimeMS = 0;
        };
        ExperientialGameManager.prototype.playerDamageGiven = function (damage, sprite) {
            this._currentSnapShot.mobDamagedReceieved(sprite, damage);
        };
        ExperientialGameManager.prototype.playerKilled = function (sprite) {
            this._currentSnapShot.playerKilledBy(sprite);
            this.lastPlayerDeathDeltaTimeMS = 0;
        };
        ExperientialGameManager.prototype.playerCollidedWithPlatform = function () {
            this._currentSnapShot.numberOfPlatformCollisions++;
        };
        ExperientialGameManager.prototype.mobKilled = function (mob) {
            this._currentSnapShot.mobKilled(mob);
        };
        ExperientialGameManager._instance = null;
        ExperientialGameManager.INTERVAL_MS = 1000 * 30;
        ExperientialGameManager.MIN_SURVEY_TIME_INTERVAL_MS = 1000 * 30;
        ExperientialGameManager.IS_EXPERIENCE_MODEL_ENABLED = true;
        ExperientialGameManager.gameMetricSnapShots = {
            overall: null,
            previous: null,
            current: null
        };
        return ExperientialGameManager;
    }());
    PCGGame.ExperientialGameManager = ExperientialGameManager;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var GameMetric = (function () {
        function GameMetric() {
            this.playerDeathCount = 0;
            this.playerDeathCountForMobType = {};
            this.mobDeathCount = 0;
            this.mobDeathCountForType = {};
            this.playerDamageReceivedCount = 0;
            this.playerDamageForMobType = {};
            this.mobDamagedByPlayer = {};
            this.numberOfPlatformCollisions = 0;
            this.reset();
        }
        GameMetric.prototype.mobKilled = function (sprite) {
            var mobType = this._getMobType(sprite);
            this.mobDeathCountForType[this._getMobKeyForType(mobType)]++;
            this.mobDeathCount++;
        };
        GameMetric.prototype.playerDamagedBy = function (sprite, damage) {
            console.log('MM !!! Player damaged by ', sprite);
            var mobType = this._getMobType(sprite);
            this.playerDamageForMobType[this._getMobKeyForType(mobType)] += damage;
            this.playerDamageReceivedCount += damage;
        };
        GameMetric.prototype.mobDamagedReceieved = function (sprite, damage) {
            console.log('MM !!! Mob damaged by Player ', sprite);
            var mobType = this._getMobType(sprite);
            this.mobDamagedByPlayer[this._getMobKeyForType(mobType)] += damage;
        };
        GameMetric.prototype.playerKilledBy = function (sprite) {
            console.log('!!! Player killed by ', sprite);
            var mobType = this._getMobType(sprite);
            this.playerDeathCountForMobType[this._getMobKeyForType(mobType)]++;
            this.playerDeathCount++;
        };
        GameMetric.prototype._getMobType = function (sprite) {
            return Generator.Block.getMobEnumType(sprite);
        };
        GameMetric.prototype._getMobKeyForType = function (type) {
            var mobClass = 'MOB_NULL';
            switch (type) {
                case 3:
                    mobClass = 'Notch';
                    break;
                case 4:
                    mobClass = 'Meteor';
                    break;
                case 5:
                    mobClass = 'Invader';
                    break;
                case 6:
                    mobClass = 'MegaHead';
                    break;
                case 0:
                    mobClass = 'Platform';
                    break;
                case 1:
                    mobClass = 'PushPlatform';
                    break;
                default:
                    break;
            }
            return mobClass;
        };
        GameMetric.prototype.mergeStats = function (gameMetric) {
            for (var i = 0; i < GameMetric.MOB_TYPES.length; i++) {
                var mob = GameMetric.MOB_TYPES[i];
                this.mobDeathCountForType[mob] += gameMetric.mobDeathCountForType[mob];
                this.playerDeathCountForMobType[mob] += gameMetric.playerDeathCountForMobType[mob];
                this.playerDamageForMobType[mob] += gameMetric.playerDamageForMobType[mob];
                this.mobDamagedByPlayer[mob] += gameMetric.mobDamagedByPlayer[mob];
            }
            this.playerDeathCount += gameMetric.playerDeathCount;
            this.playerDamageReceivedCount += gameMetric.playerDamageReceivedCount;
            this.mobDeathCount += gameMetric.mobDeathCount;
            this.numberOfPlatformCollisions += gameMetric.numberOfPlatformCollisions;
            return this;
        };
        GameMetric.prototype.getMostDangerousMobs = function () {
        };
        GameMetric.prototype.reset = function () {
            for (var i = 0; i < GameMetric.MOB_TYPES.length; i++) {
                var mob = GameMetric.MOB_TYPES[i];
                this.mobDeathCountForType[mob] = 0;
                this.playerDeathCountForMobType[mob] = 0;
                this.playerDamageForMobType[mob] = 0;
                this.mobDamagedByPlayer[mob] = 0;
            }
            this.playerDeathCount = 0;
            this.playerDamageReceivedCount = 0;
            this.mobDeathCount = 0;
            this.numberOfPlatformCollisions = 0;
        };
        GameMetric.MOB_TYPES = [
            'Notch',
            'Meteor',
            'Invader',
            'MegaHead',
            'Platform',
            'PushPlatform'
        ];
        return GameMetric;
    }());
    PCGGame.GameMetric = GameMetric;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var SurveyManager = (function () {
        function SurveyManager(id) {
            this._modal = null;
            this._modal = new Modal(id);
        }
        SurveyManager.prototype.showSurvey = function () {
            this._modal.open();
        };
        Object.defineProperty(SurveyManager.prototype, "modalEvent", {
            get: function () {
                return this._modal.modalCompleteSignal;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyManager.prototype, "isShowing", {
            get: function () {
                return this._modal.isOpen;
            },
            enumerable: true,
            configurable: true
        });
        return SurveyManager;
    }());
    PCGGame.SurveyManager = SurveyManager;
    var Modal = (function () {
        function Modal(id) {
            var _this = this;
            this._isOpen = false;
            this._modalEl = null;
            this.modalCompleteSignal = null;
            this._modalEl = $('#' + id);
            this._modalEl.on('show.bs.modal', function () {
                _this._isOpen = true;
                _this._dispatchEvent();
            });
            this._modalEl.on('hidden.bs.modal', function () {
                _this._isOpen = false;
                _this._dispatchEvent();
            });
            this.modalCompleteSignal = new Phaser.Signal();
        }
        Modal.prototype.open = function (shouldOpen) {
            if (shouldOpen === void 0) { shouldOpen = true; }
            this._isOpen = shouldOpen || !this._isOpen;
            this._modalEl.modal((this._isOpen ? 'show' : 'hide'));
        };
        Object.defineProperty(Modal.prototype, "isOpen", {
            get: function () {
                return this._isOpen;
            },
            enumerable: true,
            configurable: true
        });
        Modal.prototype._dispatchEvent = function () {
            this.modalCompleteSignal.dispatch({ isOpen: this._isOpen, values: {} });
        };
        return Modal;
    }());
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Animation = (function () {
        function Animation() {
        }
        Animation.EXPLODE_ID = 'explode';
        return Animation;
    }());
    PCGGame.Animation = Animation;
})(PCGGame || (PCGGame = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PCGGame;
(function (PCGGame) {
    var BackgroundLayer = (function (_super) {
        __extends(BackgroundLayer, _super);
        function BackgroundLayer(game, parent) {
            _super.call(this, game, parent);
            this._starWidth = 0;
            this._nextFarthestStarX = 0;
            this._nextClosestStarX = 0;
            this._prevX = -1;
            this._starWidth = this.game.cache.getImage(BackgroundLayer.STAR_ID).width;
            this._fartherStars = new Phaser.Group(game, this);
            this._fartherStars.createMultiple(Math.round(BackgroundLayer.MAX_STARS * 3), BackgroundLayer.STAR_ID, 0, true);
            this._closerStars = new Phaser.Group(game, this);
            this._closerStars.createMultiple(BackgroundLayer.MAX_STARS, BackgroundLayer.STAR_ID, 0, true);
            this._closerStars.forEach(function (star) {
                star.scale = new Phaser.Point(1.1, 1.1);
            }, this);
        }
        BackgroundLayer.prototype.render = function (x) {
            if (this._prevX < x) {
                this._manageStars(x * 0.5);
            }
            this._prevX = x;
        };
        BackgroundLayer.prototype._manageStars = function (x) {
            var _this = this;
            this._closerStars.x = x;
            this._fartherStars.x = x;
            this._closerStars.forEachExists(function (star) {
                star.x--;
                if (star.x < (x - _this._starWidth)) {
                    star.exists = false;
                }
            }, this);
            this._fartherStars.forEachExists(function (star) {
                if (star.x < (x - _this._starWidth)) {
                    star.exists = false;
                }
            }, this);
            var screenX = x + this.game.width;
            while (this._nextFarthestStarX < screenX) {
                var starX = this._nextFarthestStarX;
                this._nextFarthestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);
                var star = this._fartherStars.getFirstExists(false);
                if (star === null) {
                    break;
                }
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }
            while (this._nextClosestStarX < screenX) {
                var starX = this._nextClosestStarX;
                this._nextClosestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);
                var star = this._closerStars.getFirstExists(false);
                if (star === null) {
                    break;
                }
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }
        };
        BackgroundLayer.MAX_STARS = 25;
        BackgroundLayer.STAR_DIST_MIN = 0;
        BackgroundLayer.STAR_DIST_MAX = 25;
        BackgroundLayer.STAR_ID = 'stars';
        return BackgroundLayer;
    }(Phaser.Group));
    PCGGame.BackgroundLayer = BackgroundLayer;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Sprite = (function (_super) {
        __extends(Sprite, _super);
        function Sprite(game, x, y, id) {
            _super.call(this, game, x, y, id);
            this.mobType = 2;
            this.spriteFactoryParent = null;
            this.canCollide = true;
            this.dangerLevel = 0;
            this.weaponDamageCost = 10;
            this.aggressionProbability = 0;
            this.difficultyLevel = 0;
            this._isInvincible = false;
            this._id = null;
            this._isDead = false;
            this._weapon = null;
            this._loot = null;
            this._killScoreVal = 10;
            this._id = id;
            this.health = 100;
        }
        Object.defineProperty(Sprite.prototype, "isInvincible", {
            get: function () {
                return this._isInvincible;
            },
            set: function (isInvincibleFlag) {
                this._isInvincible = isInvincibleFlag;
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.render = function (player) {
            if (this._isDead && this.hasLoot) {
                this.angle = (this.angle - 1) % 360;
                this.game.physics.arcade.moveToObject(this, player, 1000, 800);
            }
        };
        Sprite.prototype.fire = function (player) {
        };
        Sprite.prototype.die = function (player) {
            var _this = this;
            if (this._isDead) {
                return;
            }
            this._isDead = true;
            this.loadTexture(PCGGame.Animation.EXPLODE_ID);
            this.animations.add(PCGGame.Animation.EXPLODE_ID, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);
            this.play(PCGGame.Animation.EXPLODE_ID, 30, false);
            this.animations.currentAnim.onComplete.add(function () {
                _this._generateLoot();
                _this._convertMobToLoot();
            }, this);
        };
        Object.defineProperty(Sprite.prototype, "died", {
            get: function () {
                return this._isDead;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite.prototype, "hasLoot", {
            get: function () {
                return this._loot !== null;
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.getLoot = function () {
            return this._loot;
        };
        Sprite.prototype._generateLoot = function () {
            console.log('Base Sprite get loot!');
            this._loot = new PCGGame.Loot();
        };
        Sprite.prototype._convertMobToLoot = function () {
            this.loadTexture(Sprite.LOOT_ID);
            if (typeof this.body !== 'undefined') {
                this.body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
                this.body.immovable = true;
            }
            this.alpha = 1;
            this.tint = this._loot.spriteTint;
        };
        Sprite.prototype.getDamageCost = function () {
            return this.weaponDamageCost;
        };
        Sprite.prototype.reset = function (x, y, health) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            _super.prototype.reset.call(this, x, y);
            this._isDead = false;
            this.angle = 0;
            this._loot = null;
            this.health = 100;
            this.alpha = 1;
            this.tint = 0xffffff;
            this.dangerLevel = 0;
            this.canCollide = true;
            this.aggressionProbability = 0;
            this.loadTexture(this._id);
        };
        Sprite.prototype.getKillScore = function () {
            return this._killScoreVal;
        };
        Sprite.prototype.tweenSpriteTint = function (obj, startColor, endColor, time, callback) {
            if (time === void 0) { time = 250; }
            if (callback === void 0) { callback = null; }
            if (obj) {
                var colorBlend_1 = { step: 0 };
                var colorTween = this.game.add.tween(colorBlend_1).to({ step: 100 }, time);
                colorTween.onUpdateCallback(function () {
                    obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend_1.step);
                });
                obj.tint = startColor;
                if (callback) {
                    colorTween.onComplete.add(function () {
                        callback();
                    });
                }
                colorTween.start();
            }
        };
        Sprite.prototype.takeDamage = function (damage) {
            this.health -= damage;
            this.tweenSpriteTint(this, 0xff00ff, 0xffffff, 500);
        };
        Object.defineProperty(Sprite.prototype, "bullets", {
            get: function () {
                var bullets = null;
                if (this._weapon !== null) {
                    bullets = this._weapon.bullets;
                }
                return bullets;
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.upgradeWeapon = function () {
            if (!this._weapon) {
                return;
            }
            this._weapon.fireRate = Math.max(this._weapon.fireRate - (this.difficultyLevel * 100), 200);
            this._weapon.bulletSpeedVariance = Math.min(this._weapon.bulletSpeedVariance + this.difficultyLevel, PCGGame.Player.MAX_WEAPON_STATS.variance);
        };
        Sprite.LOOT_ID = 'mob.loot';
        return Sprite;
    }(Phaser.Sprite));
    PCGGame.Sprite = Sprite;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            _super.call(this, PCGGame.Global.SCREEN.WIDTH, PCGGame.Global.SCREEN.HEIGHT, Phaser.AUTO, 'pcg-content');
            this.state.add('Boot', PCGGame.Boot);
            this.state.add('Preload', PCGGame.Preload);
            this.state.add('Play', PCGGame.Play);
            this.state.start('Boot');
        }
        return Game;
    }(Phaser.Game));
    PCGGame.Game = Game;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    ;
    var GameEvent = (function () {
        function GameEvent(type, payload) {
            this.type = type;
            this.payload = payload;
        }
        return GameEvent;
    }());
    PCGGame.GameEvent = GameEvent;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Invader = (function (_super) {
        __extends(Invader, _super);
        function Invader(game) {
            _super.call(this, game, 0, 0, Invader.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.2);
            this._killScoreVal = 500;
            this.mobType = 5;
            game.physics.arcade.enable(this, false);
            this.health = this.weaponDamageCost;
            var body = this.body;
            body.allowGravity = false;
            this._weapon = game.add.weapon(Invader.NUM_BULLETS, Invader.BULLET_ID);
            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width;
            this._weapon.bulletAngleOffset = 0;
            this._weapon.fireAngle = Phaser.ANGLE_LEFT;
            this._weapon.fireRate = 1500;
            this._weapon.bulletSpeedVariance = 0;
            this._weapon.trackSprite(this, 16, 0);
        }
        Invader.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
            var body = this.body;
            body.velocity.x = -150;
        };
        Invader.prototype.fire = function (player) {
            var _this = this;
            this._weapon.fire();
            this._weapon.bullets.forEachExists(function (bullet) {
                _this.game.physics.arcade.moveToObject(bullet, player, 1500, 500);
            }, this);
        };
        Invader.prototype.reset = function () {
            _super.prototype.reset.call(this);
            var body = this.body;
            body.setSize(32, 32, -5, 0);
            body.immovable = false;
            this.health = this.weaponDamageCost + (this.weaponDamageCost * this.difficultyLevel);
            this.upgradeWeapon();
            this.aggressionProbability = 30;
            this.dangerLevel = 2;
            this.animations.add(Invader.ID, [0, 1, 2, 3], 20, true);
            this.play(Invader.ID);
        };
        Invader.ID = 'Invader';
        Invader.BULLET_ID = 'Invader.Bullets';
        Invader.NUM_BULLETS = 30;
        return Invader;
    }(PCGGame.Sprite));
    PCGGame.Invader = Invader;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    ;
    var Loot = (function () {
        function Loot() {
            this._type = 0;
            this._subType = null;
            this._tint = 0x9400D3;
            this.value = 5;
            this._experientialGameManager = PCGGame.ExperientialGameManager.instance();
            this._calcType();
            this._calcLootTint();
        }
        Object.defineProperty(Loot.prototype, "subType", {
            get: function () {
                return this._subType;
            },
            set: function (type) {
                this._subType = type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Loot.prototype, "type", {
            get: function () {
                return this._type;
            },
            set: function (type) {
                this._type = type;
                this._calcLootTint();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Loot.prototype, "spriteTint", {
            get: function () {
                return this._tint;
            },
            enumerable: true,
            configurable: true
        });
        Loot.prototype._calcType = function () {
            this._type = this._experientialGameManager.lootDistributionFn.call(this);
            return this._experientialGameManager.evaluateLootAndInterveneIfDanger(this);
        };
        Loot.prototype._calcLootTint = function () {
            var tint = 0x9400D3;
            switch (this._type) {
                case 1:
                    tint = 0x0000ff;
                    break;
                case 2:
                    tint = 0xff0000;
                    break;
                case 4:
                    tint = 0x00ff00;
                    break;
                case 3:
                    tint = 0xFFD700;
                    break;
                default:
                    break;
            }
            this._tint = tint;
        };
        return Loot;
    }());
    PCGGame.Loot = Loot;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    ;
    var MainLayer = (function (_super) {
        __extends(MainLayer, _super);
        function MainLayer(game, parent) {
            _super.call(this, game, parent);
            this._lastTile = new Phaser.Point(0, 0);
            this._lastMOB = new Phaser.Point(0, 0);
            this._experientialGameManager = null;
            this._game = game;
            this._randomGenerator = game.rnd;
            this._generator = new Generator.Generator(this._randomGenerator);
            this._MOBgenerator = new Generator.MOBGenerator(this._randomGenerator);
            this._experientialGameManager = PCGGame.ExperientialGameManager.instance();
            this._MOBSpritePool = new Helper.Pool(PCGGame.SpriteSingletonFactory, Generator.Parameters.GRID.CELL.SIZE, function () {
                return new PCGGame.SpriteSingletonFactory(game);
            });
            this._wallSpritePool = new Helper.Pool(PCGGame.Platform, Generator.Parameters.GRID.CELL.SIZE, function () {
                return new PCGGame.SpriteSingletonFactory(game);
            });
            this._walls = new Phaser.Group(game, this);
            this._mobs = new Phaser.Group(game, this);
            var experientialManager = this._experientialGameManager;
            this._generator.addBlock(0, this._randomGenerator.integerInRange(0, Generator.Parameters.GRID.CELL.SIZE), this._randomGenerator.integerInRange(experientialManager.generatorParameters.PLATFORM.MIN_DISTANCE, experientialManager.generatorParameters.PLATFORM.MAX_DISTANCE), this._randomGenerator.integerInRange(experientialManager.generatorParameters.PLATFORM.MIN_DISTANCE, experientialManager.generatorParameters.PLATFORM.MAX_DISTANCE));
            this._MOBgenerator.addMob(32 * 3, this._randomGenerator.integerInRange(experientialManager.generatorParameters.MOBS.MIN_X_DISTANCE, experientialManager.generatorParameters.MOBS.MAX_X_DISTANCE), this._randomGenerator.integerInRange(experientialManager.generatorParameters.MOBS.MIN_X_DISTANCE, experientialManager.generatorParameters.MOBS.MAX_X_DISTANCE));
            this._platformGenerationState = 0;
            this._mobsGenerationState = 0;
        }
        MainLayer.prototype.render = function () {
            return;
            this._walls.forEachExists(function (sprite) {
                this.game.debug.body(sprite);
            }, this);
            this._mobs.forEachExists(function (sprite) {
                this.game.debug.body(sprite);
            }, this);
        };
        Object.defineProperty(MainLayer.prototype, "wallBlocks", {
            get: function () {
                return this._walls;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MainLayer.prototype, "mobs", {
            get: function () {
                return this._mobs;
            },
            enumerable: true,
            configurable: true
        });
        MainLayer.prototype.generate = function (leftTile, gameState) {
            var experientialManager = this._experientialGameManager;
            this._cleanTiles(leftTile);
            this._cleanMOBS(leftTile);
            var width = Math.ceil(this.game.width / Generator.Parameters.GRID.CELL.SIZE);
            if (experientialManager.isPlatformGenerationEnabled) {
                while (this._lastTile.x < leftTile + width) {
                    switch (this._platformGenerationState) {
                        case 0:
                            if (!this._generator.hasBlocks) {
                                console.error("Blocks queue is empty!");
                            }
                            var block = this._generator.getBlockFromQueue();
                            this._lastTile.copyFrom(block.position);
                            var length_1 = block.length;
                            var rows = block.rows;
                            var isHollow = block.isHollow;
                            console.warn(isHollow);
                            for (var i = 0; i < length_1; i++) {
                                rows = block.rows;
                                for (var j = 0; j < rows; j++) {
                                    if (!isHollow || j === 0 || j == (rows - 1)) {
                                        this._addPlatformSprite(this._lastTile.x, this._lastTile.y + j, block.type);
                                    }
                                    else if (i === 0 || i === (length_1 - 1)) {
                                        this._addPlatformSprite(this._lastTile.x, this._lastTile.y + j, block.type);
                                    }
                                }
                                ++this._lastTile.x;
                            }
                            this._generator.destroyBlock(block);
                            if (!this._generator.hasBlocks) {
                                this._platformGenerationState = 1;
                            }
                            break;
                        case 1:
                            this._generator.generateBlocks(this._lastTile);
                            this._platformGenerationState = 0;
                            break;
                    }
                }
            }
            else {
                this._MOBgenerator.updateLastBlockX = leftTile + experientialManager.generatorParameters.GRID.X_TOTAL;
            }
            if (gameState.start) {
                return;
            }
            if (experientialManager.isMobGenerationEnabled) {
                while (this._lastMOB.x < leftTile + width) {
                    switch (this._mobsGenerationState) {
                        case 0:
                            if (!this._MOBgenerator.hasBlocks) {
                                console.error("Mob Blocks queue is empty!");
                            }
                            var block = this._MOBgenerator.getBlockFromQueue();
                            this._lastMOB.copyFrom(block.position);
                            var length_2 = block.length;
                            while (length_2 > 0) {
                                this._addMobSprite(this._lastMOB.x, this._lastMOB.y, block.type);
                                if ((--length_2) > 0) {
                                    ++this._lastMOB.x;
                                }
                            }
                            this._MOBgenerator.destroyBlock(block);
                            if (!this._MOBgenerator.hasBlocks) {
                                this._mobsGenerationState = 1;
                            }
                            break;
                        case 1:
                            console.warn('Generate Mobs!!!!!!!!');
                            this._MOBgenerator.generateMOBs(this._lastMOB);
                            this._mobsGenerationState = 0;
                            break;
                    }
                }
            }
        };
        MainLayer.prototype._cleanMOBS = function (leftTile) {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (var i = this._mobs.length - 1; i >= 0; i--) {
                var mob = this._mobs.getChildAt(i);
                if ((mob.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._mobs.remove(mob);
                    mob.parent = null;
                    this._MOBSpritePool.destroyItem(mob.spriteFactoryParent);
                }
            }
        };
        MainLayer.prototype._cleanTiles = function (leftTile) {
            leftTile *= Generator.Parameters.GRID.CELL.SIZE;
            for (var i = this._walls.length - 1; i >= 0; i--) {
                var wall = this._walls.getChildAt(i);
                if ((wall.x - leftTile) <= -Generator.Parameters.GRID.CELL.SIZE) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallSpritePool.destroyItem(wall.spriteFactoryParent);
                }
            }
        };
        MainLayer.prototype._changeSpriteBlockTexture = function (sprite) {
            sprite.frame = this._randomGenerator.integerInRange(0, Generator.Parameters.SPRITE.FRAMES - 2);
        };
        MainLayer.prototype._addPlatformSprite = function (x, y, platformType) {
            var spriteFactory = this._wallSpritePool.createItem();
            var sprite = null;
            switch (platformType) {
                case 0:
                    sprite = spriteFactory.getPlatformMob();
                    break;
                case 1:
                    sprite = spriteFactory.getPushPlatformMob();
                    break;
                default:
                    sprite = spriteFactory.getNullMob();
                    break;
            }
            sprite.reset();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            if (platformType === 0) {
                this._changeSpriteBlockTexture(sprite);
            }
            else {
                sprite.frame = Generator.Parameters.SPRITE.FRAMES - 1;
            }
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        };
        MainLayer.prototype._addMobSprite = function (x, y, mobType) {
            var spriteFactory = this._MOBSpritePool.createItem();
            var sprite = null;
            switch (mobType) {
                case 3:
                    sprite = spriteFactory.getNotchMob();
                    break;
                case 5:
                    sprite = spriteFactory.getInvaderMob();
                    break;
                case 6:
                    sprite = spriteFactory.getMegaHeadMob();
                    break;
                case 2:
                    sprite = spriteFactory.getNullMob();
                    break;
                default:
                    sprite = spriteFactory.getMeteorMob();
                    break;
            }
            sprite.difficultyLevel = this._experientialGameManager.mobDifficultyLevel;
            sprite.reset();
            sprite.position.set(x * Generator.Parameters.GRID.CELL.SIZE, y * Generator.Parameters.GRID.CELL.SIZE);
            console.warn(x, y, sprite.position);
            if (sprite.parent === null) {
                this._mobs.add(sprite);
            }
        };
        return MainLayer;
    }(Phaser.Group));
    PCGGame.MainLayer = MainLayer;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var MegaHead = (function (_super) {
        __extends(MegaHead, _super);
        function MegaHead(game) {
            _super.call(this, game, 0, 0, MegaHead.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.5);
            this._killScoreVal = 1000;
            this.mobType = 6;
            this._weapon = game.add.weapon(MegaHead.NUM_BULLETS, MegaHead.BULLET_ID);
            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width * 2;
            this._weapon.bulletAngleOffset = 0;
            this._weapon.bulletAngleVariance = MegaHead.WEAPON_STATS.bulletAngleVariance;
            this._weapon.fireAngle = Phaser.ANGLE_LEFT;
            this._weapon.fireRate = MegaHead.WEAPON_STATS.fireRate;
            this._weapon.bulletSpeedVariance = MegaHead.WEAPON_STATS.variance;
            this._weapon.trackSprite(this, 16, 0);
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
        }
        MegaHead.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
            this.game.physics.arcade.moveToObject(this, player, 1500, 3000);
        };
        MegaHead.prototype.fire = function (player) {
            var _this = this;
            this._weapon.fire();
            this._weapon.bullets.forEachExists(function (bullet) {
                _this.game.physics.arcade.moveToObject(bullet, player, 1500, 500);
            }, this);
        };
        MegaHead.prototype.reset = function () {
            _super.prototype.reset.call(this);
            var body = this.body;
            body.setSize(78, 92);
            body.immovable = false;
            this.health = Math.min(100, 2 * (this.weaponDamageCost + (this.weaponDamageCost * this.difficultyLevel)));
            this.upgradeWeapon();
            this.dangerLevel = 3;
            this.aggressionProbability = 70;
            this.animations.add(MegaHead.ID, [0, 1, 2, 3], 1, true);
            this.play(MegaHead.ID);
        };
        MegaHead.ID = 'MegaHead';
        MegaHead.BULLET_ID = 'Invader.Bullets';
        MegaHead.NUM_BULLETS = 60;
        MegaHead.WEAPON_STATS = {
            fireRate: 400,
            variance: 0,
            bulletAngleVariance: 0
        };
        return MegaHead;
    }(PCGGame.Sprite));
    PCGGame.MegaHead = MegaHead;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Meteor = (function (_super) {
        __extends(Meteor, _super);
        function Meteor(game) {
            _super.call(this, game, 0, 0, Meteor.ID);
            this._velocityX = -50;
            this._velocityY = 0;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.2);
            this._killScoreVal = 200;
            this.mobType = 4;
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
        }
        Meteor.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
            var body = this.body;
            body.velocity.x = this._velocityX;
            body.velocity.y = this._velocityY;
            this.angle = (this.angle - 1) % 360;
        };
        Meteor.prototype.reset = function () {
            _super.prototype.reset.call(this);
            var body = this.body;
            body.setCircle(20, -5, -5);
            body.immovable = true;
            this.health = this.weaponDamageCost;
            this.dangerLevel = 1;
        };
        Meteor.ID = 'Meteor';
        return Meteor;
    }(PCGGame.Sprite));
    PCGGame.Meteor = Meteor;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Notch = (function (_super) {
        __extends(Notch, _super);
        function Notch(game) {
            _super.call(this, game, 0, 0, Notch.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.scale.set(1.5);
            this._killScoreVal = 250;
            this.mobType = 3;
            game.physics.arcade.enable(this, false);
            var body = this.body;
            body.allowGravity = false;
        }
        Notch.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
            var body = this.body;
            body.velocity.x = -10;
        };
        Notch.prototype.getDamageCost = function () {
            return -5;
        };
        Notch.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.health = this.weaponDamageCost;
            var body = this.body;
            body.setCircle(20, -5, -5);
            body.immovable = true;
            this.dangerLevel = 0;
            this.animations.add(Notch.ID, [0, 1, 2, 3, 4, 5], 20, true);
            this.play(Notch.ID);
        };
        Notch.ID = 'Notch';
        return Notch;
    }(PCGGame.Sprite));
    PCGGame.Notch = Notch;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var NullSprite = (function (_super) {
        __extends(NullSprite, _super);
        function NullSprite(game) {
            _super.call(this, game, 0, 0);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.frame = 0;
            this._killScoreVal = 0;
            this.mobType = 2;
        }
        NullSprite.prototype.getDamageCost = function () {
            return this.weaponDamageCost;
        };
        NullSprite.prototype.render = function (player) {
        };
        NullSprite.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.canCollide = false;
            this.dangerLevel = 0;
        };
        NullSprite.ID = 'null';
        return NullSprite;
    }(PCGGame.Sprite));
    PCGGame.NullSprite = NullSprite;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Platform = (function (_super) {
        __extends(Platform, _super);
        function Platform(game) {
            _super.call(this, game, 0, 0, Platform.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.frame = 0;
            this._killScoreVal = 20;
            this.mobType = 0;
            game.physics.arcade.enable(this, false);
        }
        Platform.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
        };
        Platform.prototype.getDamageCost = function () {
            return this.weaponDamageCost;
        };
        Platform.prototype.reset = function () {
            _super.prototype.reset.call(this);
            var body = this.body;
            body.setSize(32, 32, -3, 0);
            body.allowGravity = false;
            body.immovable = true;
            body.moves = true;
            this.health = this.weaponDamageCost * 3;
            this.dangerLevel = 1;
        };
        Platform.ID = 'PlatformBlock';
        return Platform;
    }(PCGGame.Sprite));
    PCGGame.Platform = Platform;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(game) {
            _super.call(this, game, game.width / 4, game.height / 2, Player.ID);
            this.playerLives = Player.PLAYER_LIVES;
            this._minX = 0;
            this._maxX = 0;
            this._bulletFrameNumber = 0;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            var scale = 1.5;
            this.scale.set(scale);
            this.playerEvents = new Phaser.Signal();
            this.mobType = -1;
            this._weapon = game.add.weapon(Player.NUM_BULLETS, Player.BULLET_ID);
            this._weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this._weapon.bulletKillDistance = this.game.width * 2.5;
            this._weapon.setBulletFrames(0, Player.NUM_BULLET_FRAMES, true);
            this._weapon.bulletAngleOffset = 0;
            this._weapon.bulletAngleVariance = Player.WEAPON_STATS.bulletAngleVariance;
            this._weapon.fireAngle = Phaser.ANGLE_RIGHT;
            this._weapon.fireRate = Player.WEAPON_STATS.fireRate;
            this._weapon.bulletSpeedVariance = Player.WEAPON_STATS.variance;
            this._weapon.trackSprite(this, 16, 0);
            game.physics.arcade.enable(this, false);
            this.body.allowGravity = false;
            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
        }
        Object.defineProperty(Player.prototype, "minX", {
            set: function (n) {
                this._minX = n;
                this.x = Math.max(this.x, this._minX);
                this.body.velocity.y = 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "maxX", {
            set: function (n) {
                this._maxX = n;
                this.x = Math.min(this.x, this._maxX);
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype._updateBulletSpeed = function (speed) {
            var playerBody = this.body;
            this._weapon.bulletSpeed = (speed || playerBody.velocity.x) + 200;
        };
        Player.prototype.moveRight = function () {
            this.x = Math.min(this.x + Player.VELOCITY_INC, this._maxX);
            this._updateBulletSpeed();
        };
        Player.prototype.moveLeft = function () {
            this.x = Math.max(this.x - Player.VELOCITY_INC, this._minX);
            this._updateBulletSpeed();
        };
        Player.prototype.fire = function () {
            this._weapon.fire();
        };
        Player.prototype.getDamageCost = function () {
            return this.weaponDamageCost;
        };
        Player.prototype.takeLoot = function (loot) {
            console.log('Got loot! ', loot, loot.spriteTint);
            PCGGame.ExperientialGameManager.instance().evaluateLootAndInterveneIfDanger(loot);
            var type = loot.subType || loot.type;
            switch (type) {
                case 2:
                    this.health = Math.min(100, this.health + (loot.value * 2));
                    break;
                case 1:
                    this.upgradeWeapon(loot.value);
                    break;
                case 4:
                    this.playerLives++;
                    break;
                default:
                    break;
            }
            this.playerEvents.dispatch(new PCGGame.GameEvent(4, loot));
            this.tweenSpriteTint(this, loot.spriteTint, 0xffffff, 2000);
        };
        Player.prototype.upgradeWeapon = function (inc) {
            this._weapon.fireRate = Math.max(this._weapon.fireRate - inc, Player.MAX_WEAPON_STATS.fireRate);
            this._weapon.bulletSpeedVariance = Math.max(this._weapon.bulletSpeedVariance + 1, Player.MAX_WEAPON_STATS.variance);
            this._weapon.bulletAngleVariance = Math.min(this._weapon.bulletAngleVariance + 0.5, Player.MAX_WEAPON_STATS.bulletAngleVariance);
            this._bulletFrameNumber = Math.min(this._bulletFrameNumber + 1, Player.NUM_BULLET_FRAMES);
        };
        Player.prototype.die = function () {
            var _this = this;
            if (this._isDead) {
                return;
            }
            this._isDead = true;
            this.playerLives--;
            this.loadTexture(PCGGame.Animation.EXPLODE_ID);
            this.animations.add(PCGGame.Animation.EXPLODE_ID, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16], 20, false);
            this.play(PCGGame.Animation.EXPLODE_ID, 30, false);
            this.animations.currentAnim.onComplete.add(function () {
                _this.playerEvents.dispatch(new PCGGame.GameEvent(1, _this));
                if (_this.playerLives > 0) {
                    _this.resetPlayerAfterDeath();
                    _this.playerEvents.dispatch(new PCGGame.GameEvent(3, _this));
                }
                else {
                    _this.body.velocity.x = 0;
                    _this.body.velocity.y = 0;
                    _this.visible = false;
                }
            }, this);
            this._updateBulletSpeed(Generator.Parameters.VELOCITY.X);
        };
        Player.prototype.resetPlayerAfterDeath = function () {
            _super.prototype.reset.call(this);
            this.x = Generator.Parameters.GRID.CELL.SIZE;
            this.y = this.game.height / 2;
            this.visible = true;
            this.body.immovable = true;
            this.body.velocity.x = Generator.Parameters.VELOCITY.X;
        };
        Player.prototype.reset = function () {
            this.resetPlayerAfterDeath();
            this.playerLives = Player.PLAYER_LIVES;
            return this;
        };
        Object.defineProperty(Player.prototype, "bullets", {
            get: function () {
                return this._weapon.bullets;
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype._toggleInvincibilityTween = function (shouldReverse) {
            var _this = this;
            var startTint = 0xffffff;
            var endTint = 0x333333;
            if (!this._isInvincible) {
                this.tint = startTint;
                return;
            }
            var reverse = shouldReverse === true ? true : false;
            if (reverse === true) {
                this.tweenSpriteTint(this, startTint, endTint, 1000, function () {
                    _this._toggleInvincibilityTween(!reverse);
                });
            }
            else {
                this.tweenSpriteTint(this, endTint, startTint, 1000, function () {
                    _this._toggleInvincibilityTween(!reverse);
                });
            }
        };
        Object.defineProperty(Player.prototype, "isInvincible", {
            get: function () {
                return this._isInvincible;
            },
            set: function (isInvincibleFlag) {
                if (isInvincibleFlag !== this._isInvincible) {
                    this._isInvincible = isInvincibleFlag;
                }
                this._toggleInvincibilityTween();
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.takeDamage = function (damage) {
            if (this._isInvincible) {
                return;
            }
            console.log(this.health, damage);
            this.health -= damage;
            this.playerEvents.dispatch(new PCGGame.GameEvent(2, damage));
            if (this.health <= 0) {
                this.die();
                this.health = 1;
                return;
            }
            this.tweenSpriteTint(this, 0xff00ff, 0xffffff, 1000);
        };
        Player.prototype.isInDanger = function () {
            var playerInDanger = false;
            if (this.playerLives === 1) {
                playerInDanger = true;
            }
            return playerInDanger;
        };
        Player.ID = 'Player';
        Player.BULLET_ID = 'Player.Bullet';
        Player.VELOCITY_INC = 5;
        Player.NUM_BULLETS = 150;
        Player.PLAYER_LIVES = 4;
        Player.NUM_BULLET_FRAMES = 80;
        Player.WEAPON_STATS = {
            fireRate: 200,
            variance: 0,
            bulletAngleVariance: 0
        };
        Player.MAX_WEAPON_STATS = {
            fireRate: 40,
            variance: 10,
            bulletAngleVariance: 8
        };
        return Player;
    }(PCGGame.Sprite));
    PCGGame.Player = Player;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var PushPlatform = (function (_super) {
        __extends(PushPlatform, _super);
        function PushPlatform(game) {
            _super.call(this, game, 0, 0, PCGGame.Platform.ID);
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.frame = 11;
            this._killScoreVal = 20;
            this.mobType = 1;
            game.physics.arcade.enable(this, false);
        }
        PushPlatform.prototype.render = function (player) {
            _super.prototype.render.call(this, player);
            if (this.died) {
                return;
            }
        };
        PushPlatform.prototype.getDamageCost = function () {
            return this.weaponDamageCost;
        };
        PushPlatform.prototype.reset = function () {
            _super.prototype.reset.call(this);
            var body = this.body;
            body.setSize(32, 32, -3, 0);
            this.frame = 11;
            body.allowGravity = false;
            body.immovable = false;
            body.moves = true;
            this.health = this.weaponDamageCost * 3;
            this.dangerLevel = 1;
        };
        PushPlatform.ID = 'PlatformBlock';
        return PushPlatform;
    }(PCGGame.Sprite));
    PCGGame.PushPlatform = PushPlatform;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var SpriteSingletonFactory = (function () {
        function SpriteSingletonFactory(game) {
            this._game = null;
            this._mobs = {
                NOTCH: null,
                INVADER: null,
                METEOR: null,
                MEGAHEAD: null,
                NULL_MOB: null,
                PLATFORM_TYPE: null,
                PUSH_PLATFORM_TYPE: null
            };
            this._game = game;
        }
        SpriteSingletonFactory.prototype._addCommonSpriteAttributes = function (sprite, shouldEnablePhysics) {
            if (shouldEnablePhysics === void 0) { shouldEnablePhysics = true; }
            sprite.spriteFactoryParent = this;
            if (shouldEnablePhysics) {
                this._game.physics.enable(sprite, Phaser.Physics.ARCADE);
                var body = sprite.body;
                body.allowGravity = false;
                body.immovable = false;
                body.moves = true;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
            }
            return sprite;
        };
        SpriteSingletonFactory.instance = function (game) {
            if (SpriteSingletonFactory._instance === null && game) {
                SpriteSingletonFactory._instance = new SpriteSingletonFactory(game);
            }
            return SpriteSingletonFactory._instance;
        };
        SpriteSingletonFactory.prototype.getNotchMob = function () {
            if (this._mobs.NOTCH === null) {
                this._mobs.NOTCH = this._addCommonSpriteAttributes(new PCGGame.Notch(this._game));
            }
            return this._mobs.NOTCH;
        };
        SpriteSingletonFactory.prototype.getInvaderMob = function () {
            if (this._mobs.INVADER === null) {
                this._mobs.INVADER = this._addCommonSpriteAttributes(new PCGGame.Invader(this._game));
            }
            return this._mobs.INVADER;
        };
        SpriteSingletonFactory.prototype.getMegaHeadMob = function () {
            if (this._mobs.MEGAHEAD === null) {
                this._mobs.MEGAHEAD = this._addCommonSpriteAttributes(new PCGGame.MegaHead(this._game));
            }
            return this._mobs.MEGAHEAD;
        };
        SpriteSingletonFactory.prototype.getMeteorMob = function () {
            if (this._mobs.METEOR === null) {
                this._mobs.METEOR = this._addCommonSpriteAttributes(new PCGGame.Meteor(this._game));
            }
            return this._mobs.METEOR;
        };
        SpriteSingletonFactory.prototype.getNullMob = function () {
            if (this._mobs.NULL_MOB === null) {
                this._mobs.NULL_MOB = this._addCommonSpriteAttributes(new PCGGame.NullSprite(this._game), false);
            }
            return this._mobs.NULL_MOB;
        };
        SpriteSingletonFactory.prototype.getPlatformMob = function () {
            if (this._mobs.PLATFORM_TYPE === null) {
                this._mobs.PLATFORM_TYPE = this._addCommonSpriteAttributes(new PCGGame.Platform(this._game));
            }
            return this._mobs.PLATFORM_TYPE;
        };
        SpriteSingletonFactory.prototype.getPushPlatformMob = function () {
            if (this._mobs.PUSH_PLATFORM_TYPE === null) {
                this._mobs.PUSH_PLATFORM_TYPE = this._addCommonSpriteAttributes(new PCGGame.PushPlatform(this._game));
            }
            return this._mobs.PUSH_PLATFORM_TYPE;
        };
        SpriteSingletonFactory._instance = null;
        return SpriteSingletonFactory;
    }());
    PCGGame.SpriteSingletonFactory = SpriteSingletonFactory;
})(PCGGame || (PCGGame = {}));
var Generator;
(function (Generator) {
    ;
    var Block = (function () {
        function Block() {
            this.position = new Phaser.Point(0, 0);
            this.offset = new Phaser.Point(0, 0);
            this.isHollow = false;
            this.type = 2;
        }
        Block.getMobEnumType = function (sprite) {
            var type = 2;
            if (sprite instanceof PCGGame.Notch) {
                type = 3;
            }
            else if (sprite instanceof PCGGame.Meteor) {
                type = 4;
            }
            else if (sprite instanceof PCGGame.Invader) {
                type = 5;
            }
            else if (sprite instanceof PCGGame.Platform) {
                type = 0;
            }
            else if (sprite instanceof PCGGame.PushPlatform) {
                type = 1;
            }
            else if (sprite instanceof PCGGame.MegaHead) {
                type = 6;
            }
            return type;
        };
        Block.prototype.reset = function () {
            this.length = 1;
            this.rows = 1;
            this.isHollow = false;
            this.position.x = 0;
            this.position.y = 0;
            this.offset.x = 0;
            this.offset.y = 0;
        };
        return Block;
    }());
    Generator.Block = Block;
})(Generator || (Generator = {}));
var Generator;
(function (Generator_1) {
    var Generator = (function () {
        function Generator(randomGenerator) {
            this._experientialGameManager = null;
            this._blocksQueue = new Array(Generator_1.Parameters.GRID.CELL.SIZE);
            this._blocksQueueTop = 0;
            this._hlpPoint = new Phaser.Point();
            this._randomGenerator = randomGenerator;
            this._blockPool = new Helper.Pool(Generator_1.Block, 16);
            this._experientialGameManager = PCGGame.ExperientialGameManager.instance();
        }
        Generator.prototype._createBlock = function () {
            var block = this._blockPool.createItem();
            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }
            return block;
        };
        Object.defineProperty(Generator.prototype, "hasBlocks", {
            get: function () {
                return this._blocksQueueTop > 0;
            },
            enumerable: true,
            configurable: true
        });
        Generator.prototype.addBlockToQueue = function (block) {
            this._blocksQueue[this._blocksQueueTop++] = block;
        };
        Generator.prototype.getBlockFromQueue = function () {
            if (this._blocksQueueTop === 0) {
                return null;
            }
            var block = this._blocksQueue[0];
            for (var i = 0; i < this._blocksQueueTop - 1; i++) {
                this._blocksQueue[i] = this._blocksQueue[i + 1];
            }
            this._blocksQueue[--this._blocksQueueTop] = null;
            return block;
        };
        Generator.prototype.destroyBlock = function (block) {
            this._blockPool.destroyItem(block);
        };
        Generator.prototype.addBlock = function (x, y, length, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = length;
            this.addBlockToQueue(block);
            return block;
        };
        Generator.prototype.generateBlocksPattern = function (lastTile) {
            var oldQueueTop = this._blocksQueueTop;
            var generatorParams = this._experientialGameManager.generatorParameters;
            var hlpPos = this._hlpPoint;
            hlpPos.copyFrom(lastTile);
            var length = null;
            if (this._randomGenerator.integerInRange(0, 99) < generatorParams.PLATFORM.NEW_PATTERN_COMPOSITION_PERCENTAGE) {
                length = this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_LENGTH, generatorParams.PLATFORM.MAX_LENGTH);
            }
            var baseBlockCount = generatorParams.PLATFORM.NEW_PATTERN_REPEAT_LENGTH;
            for (var i = 0; i < baseBlockCount; i++) {
                var block = this._generate(hlpPos, length);
                hlpPos.copyFrom(block.position);
                hlpPos.x += block.length - 1;
                this.addBlockToQueue(block);
            }
            var repeat = 1;
            for (var i = 0; i < repeat; i++) {
                for (var p = 0; p < baseBlockCount; p++) {
                    var templateBlock = this._blocksQueue[oldQueueTop + p];
                    var block = this._generate(hlpPos, length, templateBlock.rows, templateBlock.offset.x, templateBlock.offset.y);
                    hlpPos.copyFrom(block.position);
                    hlpPos.x += block.length - 1;
                    this.addBlockToQueue(block);
                }
            }
        };
        Generator.prototype.generateBlocksRandomly = function (lastTile) {
            var block = this._generate(lastTile);
            this.addBlockToQueue(block);
        };
        Generator.prototype.generateBlocks = function (lastTile) {
            var probability = this._randomGenerator.integerInRange(0, 99);
            if (probability < this._experientialGameManager.generatorParameters.PLATFORM.GENERATE_BLOCK_THRESHOLD) {
                this.generateBlocksRandomly(lastTile);
            }
            else {
                this.generateBlocksPattern(lastTile);
            }
        };
        Generator.prototype._generate = function (lastPosition, length, rows, offsetX, offsetY) {
            var generatorParams = this._experientialGameManager.generatorParameters;
            var block = this._createBlock();
            block.type = this._experientialGameManager.platformDistributionFn.call(this);
            var upperBlockBound = 0;
            var lowerBlockBound = (PCGGame.Global.SCREEN.HEIGHT - Generator_1.Parameters.GRID.CELL.SIZE) / Generator_1.Parameters.GRID.CELL.SIZE;
            var deltaGridY = lowerBlockBound - upperBlockBound;
            var minY = -generatorParams.PLATFORM.MIN_DISTANCE * 2;
            var maxY = lowerBlockBound - upperBlockBound;
            var currentY = lastPosition.y - upperBlockBound;
            var shiftY = 0;
            if (typeof offsetY === 'undefined') {
                shiftY = this._randomGenerator.integerInRange(0, deltaGridY);
                shiftY -= currentY;
                shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            }
            else {
                shiftY = offsetY;
            }
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);
            block.position.y = newY + upperBlockBound;
            var shiftX = offsetX || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_DISTANCE, generatorParams.PLATFORM.MAX_DISTANCE);
            block.position.x = lastPosition.x + shiftX;
            block.offset.x = shiftX;
            block.length = length || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_LENGTH, generatorParams.PLATFORM.MAX_LENGTH);
            block.rows = rows || this._randomGenerator.integerInRange(generatorParams.PLATFORM.MIN_LENGTH, generatorParams.PLATFORM.MAX_LENGTH);
            if (block.rows > 2 && block.length > 2) {
                block.isHollow = true;
            }
            this._lastGeneratedBlock = block;
            return block;
        };
        return Generator;
    }());
    Generator_1.Generator = Generator;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var MOBGenerator = (function () {
        function MOBGenerator(randomGenerator) {
            this._blocksQueue = new Array(Generator.Parameters.GRID.CELL.SIZE);
            this._blocksQueueTop = 0;
            this._experientialGameManager = null;
            this._randomGenerator = randomGenerator;
            this._blockPool = new Helper.Pool(Generator.Block, Generator.Parameters.GRID.CELL.SIZE);
            this._experientialGameManager = PCGGame.ExperientialGameManager.instance();
        }
        MOBGenerator.prototype._createBlock = function () {
            var block = this._blockPool.createItem();
            if (block === null) {
                console.error('Block generation failed - game is busted :(');
            }
            return block;
        };
        Object.defineProperty(MOBGenerator.prototype, "hasBlocks", {
            get: function () {
                return this._blocksQueueTop > 0;
            },
            enumerable: true,
            configurable: true
        });
        MOBGenerator.prototype.addBlockToQueue = function (block) {
            this._blocksQueue[this._blocksQueueTop++] = block;
        };
        MOBGenerator.prototype.getBlockFromQueue = function () {
            if (this._blocksQueueTop === 0) {
                return null;
            }
            var block = this._blocksQueue[0];
            for (var i = 0; i < this._blocksQueueTop - 1; i++) {
                this._blocksQueue[i] = this._blocksQueue[i + 1];
            }
            this._blocksQueue[--this._blocksQueueTop] = null;
            return block;
        };
        MOBGenerator.prototype.destroyBlock = function (block) {
            this._blockPool.destroyItem(block);
        };
        MOBGenerator.prototype.addMob = function (x, y, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var block = this._createBlock();
            block.position.set(x, y);
            block.offset.set(offsetX, offsetY);
            block.length = 1;
            this.addBlockToQueue(block);
            return block;
        };
        MOBGenerator.prototype.generateMOBs = function (lastTile) {
            var block = this._generate(lastTile);
            this.addBlockToQueue(block);
        };
        Object.defineProperty(MOBGenerator.prototype, "updateLastBlockX", {
            set: function (x) {
                this._lastGeneratedBlock.position.x = x;
            },
            enumerable: true,
            configurable: true
        });
        MOBGenerator.prototype._generate = function (lastPosition) {
            var generatorParams = this._experientialGameManager.generatorParameters;
            var block = this._createBlock();
            block.type = 2 + this._experientialGameManager.mobDistributionFn.call(this);
            var upperBlockBound = 1;
            var lowerBlockBound = (PCGGame.Global.SCREEN.HEIGHT - Generator.Parameters.GRID.CELL.SIZE) / Generator.Parameters.GRID.CELL.SIZE;
            var deltaGridY = lowerBlockBound - upperBlockBound;
            var minY = -generatorParams.MOBS.MIN_DISTANCE * 2;
            var maxY = lowerBlockBound - upperBlockBound;
            var currentY = lastPosition.y - upperBlockBound;
            var shiftY = 0;
            shiftY = this._randomGenerator.integerInRange(0, deltaGridY);
            shiftY -= currentY;
            shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, deltaGridY);
            block.position.y = this._randomGenerator.integerInRange(generatorParams.MOBS.MIN_Y_DISTANCE, generatorParams.MOBS.MAX_Y_DISTANCE);
            var shiftX = this._randomGenerator.integerInRange(generatorParams.MOBS.MIN_X_DISTANCE, generatorParams.MOBS.MAX_X_DISTANCE);
            block.position.x = lastPosition.x + shiftX;
            block.length = 1;
            this._lastGeneratedBlock = block;
            console.warn(block);
            return block;
        };
        return MOBGenerator;
    }());
    Generator.MOBGenerator = MOBGenerator;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Parameters = (function () {
        function Parameters() {
        }
        Parameters.GRID = {
            HEIGHT: 24,
            CELL: {
                SIZE: 32,
                STEPS: 4
            },
            MIN_CELL: 0,
            MAX_CELL: 20
        };
        Parameters.SPRITE = {
            WIDTH: 32,
            HEIGHT: 32,
            FRAMES: 11
        };
        Parameters.PLAYER = {
            BODY: {
                WIDTH: 32,
                HEIGHT: 32
            }
        };
        Parameters.GENERATE_BLOCK_THRESHOLD = 50;
        Parameters.PLATFORM_BLOCKS = {
            MIN_LENGTH: 1,
            MAX_LENGTH: 5,
            MIN_DISTANCE: 5,
            MAX_DISTANCE: 10,
            NEW_PATTERN_REPEAT_LENGTH: 2,
            NEW_PATTERN_COMPOSITION_PERCENTAGE: 50
        };
        Parameters.VELOCITY = {
            X: 180
        };
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
var Helper;
(function (Helper) {
    var Pool = (function () {
        function Pool(classType, count, newItemFunction) {
            this._newItemFunction = null;
            this._itemCount = 0;
            this._pool = [];
            this._canGrow = true;
            this._poolSize = 0;
            this._classType = classType;
            this._newItemFunction = newItemFunction;
            for (var i = 0; i < count; i++) {
                this._pool.push(this.newItem());
                this._itemCount++;
            }
        }
        Pool.prototype.createItem = function () {
            if (this._itemCount === 0) {
                return this._canGrow ? this.newItem() : null;
            }
            else {
                return this._pool[--this._itemCount];
            }
        };
        Pool.prototype.destroyItem = function (item) {
            this._pool[this._itemCount++] = item;
        };
        Pool.prototype.newItem = function () {
            var item = null;
            if (typeof this._newItemFunction === 'function') {
                item = this._newItemFunction();
            }
            else {
                item = new this._classType;
            }
            ++this._poolSize;
            return item;
        };
        Object.defineProperty(Pool.prototype, "newItemFunction", {
            set: function (newFunction) {
                this._newItemFunction = newFunction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pool.prototype, "canGrow", {
            set: function (canGrow) {
                this._canGrow = canGrow;
            },
            enumerable: true,
            configurable: true
        });
        return Pool;
    }());
    Helper.Pool = Pool;
})(Helper || (Helper = {}));
var PCGGame;
(function (PCGGame) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            _super.apply(this, arguments);
        }
        Boot.prototype.create = function () {
            this.game.state.start('Preload');
        };
        return Boot;
    }(Phaser.State));
    PCGGame.Boot = Boot;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            _super.apply(this, arguments);
            this.experientialGameManager = null;
            this._gameScore = 0;
            this._isShowingExperiencePrompt = false;
            this._extraLives = PCGGame.Player.PLAYER_LIVES - 1;
            this._healthBarSpriteBG = null;
            this._healthBarSprite = null;
            this._shouldShowExperientialPrompt = false;
            this._invincibilityTime = 0;
            this._soundEnabled = null;
            this._gameState = {
                start: true,
                end: false,
                paused: false
            };
            this._keysPressed = {
                fire: false
            };
            this._cursors = null;
        }
        Object.defineProperty(Play.prototype, "incScore", {
            set: function (score) {
                this._gameScore += score;
                this._gameScoreText.text = "Score: " + this._gameScore;
            },
            enumerable: true,
            configurable: true
        });
        Play.prototype.setPlayerLives = function (incDec) {
            this._extraLives += incDec;
            if (this._extraLives < 0) {
                this._gameOver();
            }
            var liveShipIcon = this._playerLivesGroup.getFirstAlive();
            var firstX = this.game.world.width - this._extraLives * (Generator.Parameters.GRID.CELL.SIZE + 5);
            var y = Generator.Parameters.GRID.CELL.SIZE;
            while (liveShipIcon) {
                liveShipIcon.kill();
                liveShipIcon = this._playerLivesGroup.getFirstAlive();
            }
            for (var i = 0; i < this._extraLives; i++) {
                var ship = this._playerLivesGroup.create(firstX + (Generator.Parameters.GRID.CELL.SIZE * i), y, PCGGame.Player.ID);
                ship.x += i > 0 ? (5 * i) : 0;
                ship.anchor.setTo(0.5, 0.5);
                ship.angle = 90;
                ship.alpha = 0.8;
            }
        };
        Play.prototype._gameOver = function () {
            this._gameState.end = true;
            this._gameState.paused = false;
            this._gameGameStateText.visible = true;
            this._updateShieldBar(0);
        };
        Play.prototype._invokeExperientialSurvey = function () {
            if (this._shouldShowExperientialPrompt && !this.experientialGameManager.surveyManager.isShowing) {
                this.togglePause();
                this.experientialGameManager.showSurvey();
            }
        };
        Play.prototype._experiencePromptFlasher = function () {
            var _this = this;
            this._gameExperiencePromptText.visible = true;
            var tween = this.game.add.tween(this._gameExperiencePromptText).to({ alpha: 1 }, 1000, 'Linear', true);
            tween.onComplete.add(function () {
                _this.game.add.tween(_this._gameExperiencePromptText).to({ alpha: 0 }, 1000, 'Linear', true);
                if (_this._isShowingExperiencePrompt) {
                    _this._experiencePromptFlasher();
                }
                else {
                    _this._gameExperiencePromptText.visible = false;
                }
            });
        };
        Play.prototype._showExperientialPrompt = function (shouldShow) {
            if (shouldShow === this._isShowingExperiencePrompt) {
                return;
            }
            this._isShowingExperiencePrompt = shouldShow;
            if (shouldShow) {
                this._gameExperiencePromptText.alpha = 0;
                this._experiencePromptFlasher();
            }
            else {
                this._gameExperiencePromptText.alpha = 1;
            }
        };
        Play.prototype._startNewGame = function () {
            this._player.reset();
            this._gameState.start = false;
            this._gameState.end = false;
            this._gameState.paused = false;
            this._extraLives = PCGGame.Player.PLAYER_LIVES - 1;
            this._gameGameStateText.text = Play.GAME_OVER_TEXT;
            this._gameGameStateText.visible = false;
            this._showExperientialPrompt(false);
            this.setPlayerLives(0);
            this.setInvincible(this._player, Play.START_GAME_INVINCIBILITY_TIME);
            this._updateShieldBar(this._player.health);
        };
        Play.prototype.setInvincible = function (player, duration) {
            if (duration === void 0) { duration = 2000; }
            if (player.isInvincible) {
                return;
            }
            player.isInvincible = true;
            this._updatePowerUpText(Play.POWER_UP_MESSAGE.INVINCIBLE + ' for ' + (duration / 1000) + ' seconds!', '#fff');
            this._invincibilityTime = duration;
        };
        Play.prototype._updateShieldBar = function (health) {
            var barWidth = this.game.width / 2;
            var barHeight = 10;
            if (this._healthBarSprite === null) {
                var meterBackgroundBitmap = this.game.add.bitmapData(barWidth, barHeight);
                meterBackgroundBitmap.ctx.beginPath();
                meterBackgroundBitmap.ctx.rect(0, 0, meterBackgroundBitmap.width, meterBackgroundBitmap.height);
                meterBackgroundBitmap.ctx.fillStyle = '#440000';
                meterBackgroundBitmap.ctx.fill();
                this._playerHealthGroup = this.game.add.group();
                this._healthBarSpriteBG = this.game.add.sprite(50, this.game.height - 39, meterBackgroundBitmap);
                this._healthBarSpriteBG.alpha = 0.5;
                this._playerHealthGroup.add(this._healthBarSpriteBG);
                var healthBitmap = this.game.add.bitmapData(barWidth - 6, barHeight - 6);
                healthBitmap.ctx.beginPath();
                healthBitmap.ctx.rect(0, 0, healthBitmap.width, healthBitmap.height);
                healthBitmap.ctx.fillStyle = '#000';
                healthBitmap.ctx.fill();
                this._healthBarSprite = this.game.add.sprite(53, this.game.height - 36, healthBitmap);
                this._healthBarSprite.alpha = 0.7;
                this._playerHealthGroup.add(this._healthBarSprite);
                var shieldSprite = this.game.add.sprite(32, this.game.height - 50, Play.SHIELD_ID);
                shieldSprite.alpha = 1;
                this._playerHealthGroup.add(shieldSprite);
            }
            this._healthBarSprite.key.context.clearRect(0, 0, this._healthBarSprite.width, this._healthBarSprite.height);
            if (health < 30) {
                this._healthBarSprite.key.context.fillStyle = '#f00';
            }
            else if (health < 64) {
                this._healthBarSprite.key.context.fillStyle = '#ff0';
            }
            else {
                this._healthBarSprite.key.context.fillStyle = '#0f0';
            }
            var m = health / 100;
            var bw = ((barWidth - 6) * m);
            this._healthBarSprite.key.context.fillRect(0, 0, bw, barHeight - 6);
            this._healthBarSprite.key.dirty = true;
        };
        Play.prototype._setUpGameHUD = function () {
            var scoreString = 'Score: ';
            this._gameScoreText = this.game.add.text(10, 15, scoreString + this._gameScore, { font: '20px opensans', fill: '#6495ED' });
            this._gameScoreText.addColor('#fff', 7);
            this._playerLivesGroup = this.game.add.group();
            this._gameGameStateText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, Play.GAME_INTRO_TEXT, { font: '32px opensans', fill: '#fff' });
            this._gameGameStateText.anchor.setTo(0.5, 0.5);
            this._gameGameStateText.visible = true;
            this._gameGamePowerUpText = this.game.add.text(this.game.width - 100, this.game.height - 32, Play.POWER_UP_MESSAGE.WEAPON, { font: '24px opensans', fill: '#00ff00' });
            this._gameGamePowerUpText.anchor.setTo(0.5, 0.5);
            this._gameGamePowerUpText.alpha = 0;
            this._gameExperiencePromptText = this.game.add.text(this.game.world.centerX - 10, 30, Play.EXPERIENTIAL_PROMPT, { font: '24px opensans', fill: '#00ff00' });
            this._gameExperiencePromptText.anchor.setTo(0.5, 0.5);
            this._gameExperiencePromptText.addColor('#fff', 10);
            this._gameExperiencePromptText.addColor('#00ff00', 15);
            this._gameExperiencePromptText.visible = false;
        };
        Play.prototype._updatePowerUpText = function (type, colour) {
            var _this = this;
            this._gameGamePowerUpText.text = type;
            this._gameGamePowerUpText.addColor(colour, 0);
            var tween = this.game.add.tween(this._gameGamePowerUpText).to({ alpha: 1 }, 300, 'Linear', true);
            tween.onComplete.add(function () {
                _this.game.add.tween(_this._gameGamePowerUpText).to({ alpha: 0 }, 2000, 'Linear', true);
            });
        };
        Play.prototype.togglePause = function () {
            this._gameState.paused = !this._gameState.paused;
            this.game.physics.arcade.isPaused = this._gameState.paused;
            if (this._gameState.paused) {
                this._gameGameStateText.text = 'Game Paused...';
                this._gameGameStateText.visible = true;
                if (this._soundEnabled) {
                    this._musicTrack.pause();
                }
            }
            else {
                this._gameGameStateText.visible = false;
                if (this._soundEnabled) {
                    this._musicTrack.resume();
                }
            }
        };
        Play.prototype.create = function () {
            var _this = this;
            this.game.time.advancedTiming = true;
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;
            PCGGame.SpriteSingletonFactory.instance(this.game);
            this._player = new PCGGame.Player(this.game);
            this._musicTrack = this.game.add.audio(Play.MUSIC_ID);
            this._musicTrack.loop = true;
            this.experientialGameManager = PCGGame.ExperientialGameManager.instance(this.game, this._player);
            this.experientialGameManager.surveyManager.modalEvent.add(function (event) {
                _this._shouldShowExperientialPrompt = event.isOpen;
                if (!_this._shouldShowExperientialPrompt) {
                    _this.togglePause();
                    _this.setInvincible(_this._player, 10000);
                }
            });
            this._player.playerEvents.add(function (e) {
                switch (e.type) {
                    case 1:
                        _this.setPlayerLives(-1);
                        break;
                    case 2:
                        _this._updateShieldBar(_this._player.health);
                        break;
                    case 3:
                        _this._updateShieldBar(_this._player.health);
                        _this.setInvincible(_this._player, 3000);
                        break;
                    case 4:
                        var loot = e.payload;
                        console.log(e.payload);
                        var type = loot.subType || loot.type;
                        switch (type) {
                            case 2:
                                _this._updateShieldBar(_this._player.health);
                                _this._updatePowerUpText(Play.POWER_UP_MESSAGE.SHIELD, '#B22222');
                                break;
                            case 1:
                                _this._updatePowerUpText(Play.POWER_UP_MESSAGE.WEAPON, '#6495ED');
                                break;
                            case 4:
                                _this.setPlayerLives(1);
                                _this._updatePowerUpText(Play.POWER_UP_MESSAGE.LIFE, '#00ff00');
                                break;
                            case 3:
                                _this._updatePowerUpText(Play.POWER_UP_MESSAGE.MYSTERY, '#FFD700');
                                _this.incScore = loot.value * 500;
                                break;
                            default:
                                _this.incScore = loot.value * 250;
                                _this._updatePowerUpText(Play.POWER_UP_MESSAGE.BONUS_POINTS, '#9400D3');
                                break;
                        }
                        break;
                    default:
                        break;
                }
                console.log(e);
            });
            this._player.reset();
            this._backgroundLayer = new PCGGame.BackgroundLayer(this.game, this.world);
            this._mainLayer = new PCGGame.MainLayer(this.game, this.world);
            this.world.add(this._player);
            this._setUpGameHUD();
            this._updateShieldBar(this._player.health);
            this._fireKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this._pauseKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
            this._invokeExperientialKey = this.game.input.keyboard.addKey(Phaser.Keyboard.C);
            this._toggleSoundKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
            this._toggleSoundKey.onDown.add(function () {
                if (_this._soundEnabled === null) {
                    _this._musicTrack.play();
                    _this._soundEnabled = true;
                    return;
                }
                if (_this._musicTrack.isPlaying) {
                    _this._musicTrack.pause();
                }
                else {
                    _this._musicTrack.resume();
                }
                _this._soundEnabled = !_this._soundEnabled;
            }, this);
            this._invokeExperientialKey.onDown.add(function () {
                console.log('Invoke Experiential Dialogue');
                _this._invokeExperientialSurvey();
            }, this);
            this._pauseKey.onUp.add(function () {
                console.log('Pause Key pressed!');
                _this.togglePause();
            }, this);
            this._fireKey.onDown.add(function () {
                _this.startPlayerAttack(true);
                console.log('Space Fire Key Down!');
            }, this);
            this._fireKey.onUp.add(function () {
                _this.startPlayerAttack(false);
                console.log('Space Fire Key Up!');
            }, this);
            this.game.input.onDown.add(function () {
                _this.startPlayerAttack(true);
                console.log('Mouse Fire Key Down!');
            }, this);
            this.game.input.onUp.add(function () {
                _this.startPlayerAttack(false);
                console.log('Mouse Fire Key Up!');
            }, this);
            this._cursors = this.game.input.keyboard.createCursorKeys();
            var lastX = null;
            this.game.input.addMoveCallback(function (pointer, x, y) {
                if (_this._gameState.paused || _this._gameState.end) {
                    return;
                }
                if (lastX === null) {
                    lastX = x;
                }
                var dx = x - lastX;
                _this._player.position.y = y;
                _this._player.position.x += dx;
                lastX = x;
            }, this);
        };
        Play.prototype.startPlayerAttack = function (shouldStartAttacking) {
            if (this.experientialGameManager.surveyManager.isShowing) {
                return;
            }
            if (shouldStartAttacking) {
                if (this._gameState.end || this._gameState.start) {
                    this._startNewGame();
                    return;
                }
                else if (this._gameState.paused) {
                    this.togglePause();
                    return;
                }
            }
            this._keysPressed.fire = shouldStartAttacking;
        };
        Play.prototype.render = function () {
            this._mainLayer.render();
        };
        Play.prototype.update = function () {
            if (this._gameState.paused || this._gameState.end) {
                this._player.body.velocity.x = 0;
                return;
            }
            this.game.debug.text((this.game.time.fps.toString() || '--') + 'fps', 2, 14, "#00ff00");
            if (this._player.isInvincible) {
                this._invincibilityTime -= this.time.physicsElapsedMS;
                if (this._invincibilityTime <= 0) {
                    this._invincibilityTime = 0;
                    this._player.isInvincible = false;
                }
            }
            this.updatePhysics();
            this.camera.x += this.time.physicsElapsed * Generator.Parameters.VELOCITY.X;
            var x = this.camera.x;
            this._gameScoreText.x = x;
            this._playerLivesGroup.x = x;
            this._playerHealthGroup.x = x;
            this._gameGameStateText.x = this.game.width / 2 + x;
            this._gameGamePowerUpText.x = x + this.game.width - 200;
            this._gameExperiencePromptText.x = x + this.game.width / 2;
            if (!(this._gameState.start || this._gameState.paused || this._gameState.end)) {
                this.experientialGameManager.update();
            }
            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE, this._gameState);
            this._backgroundLayer.render(this.camera.x);
        };
        Play.prototype.spriteBulletCollisionHandler = function (bullet, targetSprite, mob) {
            if (targetSprite.died) {
                return;
            }
            bullet.kill();
            targetSprite.takeDamage(mob.getDamageCost());
            if (targetSprite.health <= 0) {
                targetSprite.die(this._player);
            }
        };
        Play.prototype.playerBulletHitMobHandler = function (bullet, mob) {
            if (mob.died) {
                return;
            }
            this.incScore = mob.getKillScore();
            bullet.kill();
            var mobDamage = this._player.getDamageCost();
            mob.takeDamage(mobDamage);
            if (mobDamage) {
                this.experientialGameManager.playerDamageGiven(mobDamage, mob);
            }
            if (mob.health <= 0) {
                mob.die(this._player);
                this.experientialGameManager.mobKilled(mob);
            }
        };
        Play.prototype.wallPlayerCollisionHandler = function (player, wall) {
            if (wall.died) {
                if (wall.hasLoot) {
                    player.takeLoot(wall.getLoot());
                }
                wall.kill();
                return;
            }
            var wallDamage = player.getDamageCost();
            wall.takeDamage(wallDamage);
            if (wallDamage) {
                this.experientialGameManager.playerDamageGiven(wallDamage, wall);
            }
            if (wall.health <= 0) {
                wall.die(this._player);
                this.experientialGameManager.mobKilled(wall);
            }
            if (!player.isInvincible) {
                var playerDamage = wall.getDamageCost();
                player.takeDamage(playerDamage);
                if (playerDamage) {
                    this.experientialGameManager.playerDamageReceived(playerDamage, wall);
                }
                if (player.died) {
                    this.experientialGameManager.playerKilled(wall);
                }
                this.experientialGameManager.playerCollidedWithPlatform();
            }
        };
        Play.prototype.wallMobCollisionHandler = function (mob, wall) {
            mob.takeDamage(wall.getDamageCost());
            wall.takeDamage(mob.getDamageCost());
            if (wall.health <= 0) {
                wall.die(this._player);
            }
            if (!mob.died && mob.health <= 0) {
                mob.die(this._player);
            }
        };
        Play.prototype.mobPlayerCollisionHandler = function (player, mob) {
            if (!mob.died) {
                var mobDamage = player.getDamageCost();
                mob.takeDamage(mobDamage);
                if (mobDamage) {
                    this.experientialGameManager.playerDamageGiven(mobDamage, mob);
                }
                if (mob.health <= 0) {
                    mob.die(player);
                    this.experientialGameManager.mobKilled(mob);
                }
                if (!player.isInvincible) {
                    var damage = mob.getDamageCost();
                    player.takeDamage(damage);
                    if (damage) {
                        this.experientialGameManager.playerDamageReceived(damage, mob);
                    }
                    if (player.died) {
                        this.experientialGameManager.playerKilled(mob);
                    }
                }
            }
            else {
                if (mob.hasLoot) {
                    player.takeLoot(mob.getLoot());
                }
                mob.kill();
            }
        };
        Play.prototype.playerTookMobBulletDamageHandler = function (player, bullet, mob) {
            if (player.died) {
                return;
            }
            if (!player.isInvincible) {
                var damage = mob.getDamageCost();
                player.takeDamage(damage);
                this.experientialGameManager.playerDamageReceived(damage, mob);
                if (player.died) {
                    this.experientialGameManager.playerKilled(mob);
                }
            }
            bullet.kill();
        };
        Play.prototype.updatePhysics = function () {
            var _this = this;
            var playerBody = this._player.body;
            var isNotchFound = false;
            if (!this._gameState.start) {
                this.physics.arcade.collide(this._player, this._mainLayer.wallBlocks, function (player, wall) {
                    if (!wall.canCollide || (wall.mobType === 1 && !wall.hasLoot) || player.died) {
                        return;
                    }
                    _this.wallPlayerCollisionHandler(player, wall);
                });
            }
            this.physics.arcade.collide(this._player, this._mainLayer.mobs, function (player, mob) {
                if (!mob.canCollide || player.died) {
                    return;
                }
                _this.mobPlayerCollisionHandler(player, mob);
            });
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.wallBlocks, function (bullet, wall) {
                var friendlyWall = wall.mobType === 1;
                if (!wall.canCollide || friendlyWall) {
                    if (friendlyWall) {
                        bullet.kill();
                    }
                    return;
                }
                _this.playerBulletHitMobHandler(bullet, wall);
            }, null, this);
            this.game.physics.arcade.overlap(this._player.bullets, this._mainLayer.mobs, function (bullet, mob) {
                if (!mob.canCollide) {
                    return;
                }
                _this.playerBulletHitMobHandler(bullet, mob);
            }, null, this);
            this._mainLayer.wallBlocks.forEachExists(function (wall) {
                wall.render(_this._player);
                if (!wall.canCollide || wall.mobType === 1) {
                    return;
                }
                _this.game.physics.arcade.collide(wall, _this._mainLayer.wallBlocks, function (targetWall, wall) {
                    if (!targetWall.canCollide) {
                        return;
                    }
                    if (wall !== targetWall && !targetWall.died && !wall.died && !targetWall.hasLoot) {
                        _this.wallMobCollisionHandler(targetWall, wall);
                    }
                });
            }, this);
            this._mainLayer.mobs.forEachExists(function (mob) {
                if (!mob.canCollide) {
                    return;
                }
                mob.render(_this._player);
                if (!mob.died) {
                    var shouldFight = _this.game.rnd.integerInRange(0, 100);
                    if (shouldFight >= mob.aggressionProbability) {
                        mob.fire(_this._player);
                    }
                }
                _this.game.physics.arcade.collide(mob, _this._mainLayer.wallBlocks, function (mob, wall) {
                    if (!wall.canCollide) {
                        return;
                    }
                    if (!mob.died && !wall.died && !mob.hasLoot) {
                        _this.wallMobCollisionHandler(mob, wall);
                    }
                });
                if (!mob.died && mob.mobType === 3) {
                    isNotchFound = true;
                }
                if (!mob.bullets || !mob.bullets.countLiving()) {
                    return;
                }
                _this.game.physics.arcade.collide(_this._player, mob.bullets, function (player, bullet) {
                    _this.playerTookMobBulletDamageHandler(player, bullet, mob);
                });
                _this.game.physics.arcade.overlap(mob.bullets, _this._mainLayer.wallBlocks, function (bullet, wall) {
                    if (!wall.canCollide) {
                        return;
                    }
                    if (!mob.died) {
                        _this.spriteBulletCollisionHandler(bullet, wall, mob);
                    }
                }, null, _this);
                _this.game.physics.arcade.overlap(mob.bullets, _this._mainLayer.mobs, function (bullet, targetMob) {
                    if (!targetMob.died && targetMob !== mob) {
                        _this.spriteBulletCollisionHandler(bullet, targetMob, mob);
                    }
                }, null, _this);
            }, this);
            if (isNotchFound && this.experientialGameManager.isEligibleForSurvey) {
                this._shouldShowExperientialPrompt = true;
            }
            this._showExperientialPrompt(this._shouldShowExperientialPrompt);
            if (playerBody.velocity.x !== Generator.Parameters.VELOCITY.X) {
                playerBody.velocity.x = Generator.Parameters.VELOCITY.X;
            }
            this._player.minX = this.game.camera.x + Generator.Parameters.GRID.CELL.SIZE;
            this._player.maxX = this.game.camera.x + this.game.width - this._player.width / 2;
            if (this._keysPressed.fire) {
                this._player.fire();
            }
            if (this._cursors.left.isDown) {
                this._player.moveLeft();
            }
            else if (this._cursors.right.isDown) {
                this._player.moveRight();
            }
            if (this._cursors.up.isDown) {
                this._player.position.y = Math.max(playerBody.halfHeight, this._player.position.y - 5);
            }
            else if (this._cursors.down.isDown) {
                this._player.position.y = Math.min(PCGGame.Global.SCREEN.HEIGHT - playerBody.halfHeight, this._player.position.y + 5);
            }
        };
        Play.GAME_INTRO_TEXT = 'Press fire button to start.';
        Play.GAME_OVER_TEXT = 'Game Over...\n\nPress fire button to continue.';
        Play.SHIELD_ID = 'Shield';
        Play.MUSIC_ID = 'GameMusic';
        Play.START_GAME_INVINCIBILITY_TIME = 10000;
        Play.POWER_UP_MESSAGE = {
            LIFE: 'Extra Life Gained!',
            SHIELD: 'Shield Levels Up!',
            WEAPON: 'Weapon Power Upgraded!',
            BONUS_POINTS: 'Bonus Points Received!',
            MYSTERY: 'Mystery Power Received!',
            INVINCIBLE: 'You are Invincible'
        };
        Play.EXPERIENTIAL_PROMPT = 'Press the C key to configure your game!';
        return Play;
    }(Phaser.State));
    PCGGame.Play = Play;
})(PCGGame || (PCGGame = {}));
var PCGGame;
(function (PCGGame) {
    var Preload = (function (_super) {
        __extends(Preload, _super);
        function Preload() {
            _super.apply(this, arguments);
            this._isGameReady = false;
        }
        Preload.prototype.create = function () {
        };
        Preload.prototype.preload = function () {
            this.load.spritesheet(PCGGame.Platform.ID, 'assets/grid-tiles.png', Generator.Parameters.SPRITE.WIDTH, Generator.Parameters.SPRITE.HEIGHT, Generator.Parameters.SPRITE.FRAMES);
            this.load.spritesheet(PCGGame.Animation.EXPLODE_ID, 'assets/explode.png', 128, 128, 16);
            this.load.spritesheet(PCGGame.Notch.ID, 'assets/tutor-anim.png', 32, 32, 6);
            this.load.spritesheet(PCGGame.Invader.ID, 'assets/invader32x32x4.png', 32, 32, 4);
            this.load.spritesheet(PCGGame.MegaHead.ID, 'assets/metalface78x92.png', 78, 92, 4);
            this.load.spritesheet(PCGGame.Player.BULLET_ID, 'assets/rgb-bullets.png', 8, 4, PCGGame.Player.NUM_BULLET_FRAMES);
            this.load.image(PCGGame.Player.ID, 'assets/ship.png');
            this.load.image(PCGGame.Play.SHIELD_ID, 'assets/shield.png');
            this.load.image(PCGGame.Sprite.LOOT_ID, 'assets/star-particle.png');
            this.load.image(PCGGame.Invader.BULLET_ID, 'assets/enemy-bullet.png');
            this.load.image(PCGGame.Meteor.ID, 'assets/meteor.png');
            this.load.image(PCGGame.BackgroundLayer.STAR_ID, 'assets/star.png');
            this.load.audio(PCGGame.Play.MUSIC_ID, ['assets/game-music.mp3', 'assets/game-music.ogg']);
        };
        Preload.prototype.update = function () {
            if (this._isGameReady === false) {
                this._isGameReady = true;
                this.game.state.start('Play');
            }
        };
        return Preload;
    }(Phaser.State));
    PCGGame.Preload = Preload;
})(PCGGame || (PCGGame = {}));
//# sourceMappingURL=app.js.map