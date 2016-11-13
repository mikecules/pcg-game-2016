namespace PCGGame {

    export class Player extends Phaser.Sprite {

        public static ID : string = 'Player';
        public static VELOCITY_INC : number = 5;

        private _body : Phaser.Physics.Arcade.Body;


        public constructor(game : Phaser.Game) {

            super(game, 0, 0, Player.ID);

            // center the sprite horizontally
            this.anchor.x = 0.5;

            // center the sprite vertically
            this.anchor.y = 0.5;

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            this._body = <Phaser.Physics.Arcade.Body>this.body;

            this._body.allowGravity = false;
        }


        public speedUp() : void {
            let playerBody = this._body;

            playerBody.velocity.x =  Math.max(playerBody.velocity.x + Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
        }


        public slowDown() : void {
            let playerBody = this._body;

            playerBody.velocity.x = Math.max(playerBody.velocity.x - Player.VELOCITY_INC, Generator.Parameters.VELOCITY.X);
        }

        public fire() : void {

        }
    }

}