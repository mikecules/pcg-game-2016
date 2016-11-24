namespace PCGGame {

    export class BackgroundLayer extends Phaser.Group {
        private _closerStars: Phaser.Group;
        private _fartherStars: Phaser.Group;
        private _starWidth: number = 0;
        private _nextFarthestStarX : number = 0;
        private _nextClosestStarX : number = 0;
        private _prevX : number = -1;



        public static MAX_STARS = 25;
        public static STAR_DIST_MIN = 0;
        public static STAR_DIST_MAX = 25;
        public static STAR_ID: string = 'stars';



        public constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer) {
            super(game, parent);


            this._starWidth = this.game.cache.getImage(BackgroundLayer.STAR_ID).width;


            this._fartherStars = new Phaser.Group(game, this);
            this._fartherStars.createMultiple(Math.round(BackgroundLayer.MAX_STARS * 3), BackgroundLayer.STAR_ID, 0, true);


            this._closerStars = new Phaser.Group(game, this);
            this._closerStars.createMultiple(BackgroundLayer.MAX_STARS, BackgroundLayer.STAR_ID, 0, true);



            this._closerStars.forEach(function (star: Phaser.Sprite) {
                star.scale = new Phaser.Point(1.1, 1.1);
            }, this);


        }

        public render(x: number): void {

            if (this._prevX < x) {
                this._manageStars(x * 0.5);
            }

            this._prevX = x;
        }



        private _manageStars(x: number) {

            this._closerStars.x = x;
            this._fartherStars.x = x;

            // remove old
            this._closerStars.forEachExists((star: Phaser.Sprite) => {

                star.x--;

                if (star.x < (x - this._starWidth)) {
                    star.exists = false;
                }
            }, this);


            this._fartherStars.forEachExists((star: Phaser.Sprite) => {

                if (star.x < (x - this._starWidth)) {
                    star.exists = false;
                }
            }, this);



            let screenX : number = x + this.game.width;



            while (this._nextFarthestStarX < screenX) {
                // save new star position
                let starX = this._nextFarthestStarX;

                // calculate position for next star
                this._nextFarthestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);

                // get unused tree sprite
                let star = <Phaser.Sprite>this._fartherStars.getFirstExists(false);
                // if no free sprites, exit loop
                if (star === null) {
                    break;
                }

                // position tree and make it exist
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }

            // add new tree(s)
            while (this._nextClosestStarX < screenX) {
                // save new tree position
                let starX = this._nextClosestStarX;

                // calcultate position for next tree
                this._nextClosestStarX += this.game.rnd.integerInRange(BackgroundLayer.STAR_DIST_MIN, BackgroundLayer.STAR_DIST_MAX);

                // get unused tree sprite
                let star = <Phaser.Sprite>this._closerStars.getFirstExists(false);
                // if no free sprites, exit loop
                if (star === null) {
                    break;
                }

                // position tree and make it exist
                star.x = starX;
                star.y = this.game.rnd.integerInRange(0, this.game.height);
                star.exists = true;
            }

        }
    }
}