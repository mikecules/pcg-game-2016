namespace Generator {
    export class JumpTables {

        private static _instance : any = null;
        private static _debug : boolean = false;
        private static _gameConfig : any;
        private static _debugBitMapData : Phaser.BitmapData;

        private _jumpVelocityImpulseLookup : number[] = [];


        public constructor() {
            this.calcJumpVelocityImpulses();
        }

        public static get instance() : JumpTables {

            if ( JumpTables._instance === null) {
                JumpTables._instance = new JumpTables();
            }

            return JumpTables._instance;
        }

        public calcJumpVelocityImpulses() : void {

            let deltaJumHeight = Parameters.JUMP.HEIGHT.MAX - Parameters.JUMP.HEIGHT.MIN;
            this._jumpVelocityImpulseLookup.length = 0;

            for (let i = 0; i < Parameters.JUMP.HEIGHT.STEPS; i++) {
                let h = Parameters.JUMP.HEIGHT.MIN + (deltaJumHeight / Parameters.JUMP.HEIGHT.STEPS * i);

                this._jumpVelocityImpulseLookup.push(-Math.sqrt(2 * h * Parameters.GRAVITY));
            }
        }

        public get minJumpVelocityImpulse() : number {
            return this._jumpVelocityImpulseLookup[0];
        }

        public get maxJumpVelocityImpulse() : number {
            return this._jumpVelocityImpulseLookup[Parameters.JUMP.HEIGHT.STEPS - 1];
        }

        public static createDebugBitmap() {
            let gameConf = JumpTables._gameConfig;

            let bitMapData = new Phaser.BitmapData(
                gameConf.game, 'DebugGrid', gameConf.SCREEN.WIDTH, gameConf.SCREEN.HEIGHT
            );

            bitMapData.fill(200,200,200);

            for (let i = 0; i < gameConf.SCREEN.HEIGHT; i += Parameters.GRID.CELL.SIZE ) {
                bitMapData.line(0, i + 0.5, gameConf.SCREEN.WIDTH - 1, i + 0.5)
            }

            for (let j = 0; j < gameConf.SCREEN.WIDTH; j += Parameters.GRID.CELL.SIZE ) {
                bitMapData.line(j + 0.5, 0, j + 0.5, gameConf.SCREEN.HEIGHT - 1);
                bitMapData.text((j/Parameters.GRID.CELL.SIZE).toString(), j + 20, 20, '16px Courier', '#00ff00');
            }

            JumpTables._debugBitMapData = bitMapData;
        }

        public static setDebug(isDebugOn: boolean, gameConfig?: any): void {

            if (! JumpTables._instance) {
                this.instance;
            }

            JumpTables._debug = isDebugOn;

            if (typeof gameConfig !== 'undefined') {
                JumpTables._gameConfig = gameConfig;
            }

            if (! isDebugOn || ! gameConfig) {
                return;
            }

            JumpTables.createDebugBitmap();

        }

        public static get debugBitmapData() : Phaser.BitmapData {
            return JumpTables._debugBitMapData;
        }
    }
}