namespace PCGGame {
    export class Play extends Phaser.State {

        private _mainLayer: MainLayer;


        public create() {
            this.stage.backgroundColor = 0x000000;
            this.camera.bounds = null;

            //Generator.JumpTables.setDebug(true, PCGGame.Global);
            //this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
            Generator.JumpTables.instance;
            console.log('test!')
            this._mainLayer = new MainLayer(this.game, this.world);
        }

        public render() {
            this._mainLayer.render();
        }

        public update() {
            this.camera.x += this.time.physicsElapsed * Generator.Parameters.VELOCITY.X / 2;
            this._mainLayer.generate(this.camera.x / Generator.Parameters.GRID.CELL.SIZE);
        }
    }
}