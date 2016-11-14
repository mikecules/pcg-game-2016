namespace PCGGame {
    export class Animation extends Phaser.Group {

        public static EXPLODE_ID = 'explode';

        public explosion : Phaser.Group;
        private static _game : Phaser.Game = null;
        private static _parent : PIXI.DisplayObjectContainer = null;
        private static _instance : Animation = null;

        public animationStore: any = {};


        public constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer) {
            super(game, parent);

            this.animationStore.explosion =  new Phaser.Group(Animation._game, this);
            this.animationStore.explosion.createMultiple(30, Animation.EXPLODE_ID);
        }

        public static instance(game?: Phaser.Game, parent?: PIXI.DisplayObjectContainer) : Animation {

            if (game) {
                Animation._game = game;
            }

            if (parent){
                Animation._parent = parent;
            }

            if (Animation._instance === null && Animation._game !== null  && Animation._parent !== null) {
                Animation._instance = new Animation(Animation._game, Animation._parent);
            }

            return Animation._instance;

        }
    }
}