namespace PCGGame {
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
            console.log('!!!! Damage Received ', damage, ' by ', sprite);
            this._gameMetricSnapShots.current.playerDamageReceivedCount += damage;
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
        public mobDeathCount : number = 0;
        public mobDeathCountForType : any = {
            'Notch': 0,
            'Meteor': 0,
            'Invader': 0,
            'MegaHead': 0
        };

        public playerDamageReceivedCount : number = 0;
        public numberOfPlatformCollisions : number = 0;



        public mobKilled(mob : Sprite) {

            if (mob instanceof Notch) {
                this.mobDeathCountForType.Notch++;
            }
            else if (mob instanceof Meteor) {
                this.mobDeathCountForType.Meteor++;

            }
            else if (mob instanceof Invader) {
                this.mobDeathCountForType.Invader++;
            }
            else {
                this.mobDeathCountForType.MegaHead++;
            }

            this.mobDeathCount++;
        }

        public playerKilledBy(sprite : Sprite) {
            console.log('!!! Player killed by ', sprite);
            this.playerDeathCount++;
        }

        public reset() {

            this.mobDeathCountForType.Notch = 0;
            this.mobDeathCountForType.Meteor = 0;
            this.mobDeathCountForType.Invader = 0;
            this.mobDeathCountForType.MegaHead = 0;

            this.playerDeathCount = 0;
            this.playerDamageReceivedCount = 0;
            this.mobDeathCount = 0;

            this.numberOfPlatformCollisions = 0;

        }
    }
}