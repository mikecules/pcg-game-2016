/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class SpriteSingletonFactory {

        public static _instance : SpriteSingletonFactory = null;

        private _game : Phaser.Game = null;
        private _mobs : any = {
            NOTCH: null,
            INVADER: null,
            METEOR: null
        };

        public constructor(game: Phaser.Game) {
            this._game = game;
        }


        private _addCommonSpriteAttributes(sprite : Sprite) : Sprite {
            sprite.spriteFactoryParent = this;

            this._game.physics.enable(sprite, Phaser.Physics.ARCADE);
            console.log('Sprite created: ', sprite);

            let body = <Phaser.Physics.Arcade.Body>sprite.body;

            body.allowGravity = false;
            body.immovable = false;
            body.moves = true;
            body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);

            console.log(sprite);

            return sprite;
        }

        public static instance(game : Phaser.Game) : SpriteSingletonFactory {

            if (SpriteSingletonFactory._instance === null && game) {
                SpriteSingletonFactory._instance = new SpriteSingletonFactory(game);
            }

            return SpriteSingletonFactory._instance;
        }

        public getNotchMob() : Sprite {

            if (this._mobs.NOTCH === null) {
                this._mobs.NOTCH = this._addCommonSpriteAttributes(new Notch(this._game));
            }

            return this._mobs.NOTCH;

        }

        public getInvaderMob() {
            if (this._mobs.INVADER === null) {
                this._mobs.INVADER = this._addCommonSpriteAttributes(new Invader(this._game));
            }

            return this._mobs.INVADER;
        }


        public getMeteorMob() {
            if (this._mobs.METEOR === null) {
                this._mobs.METEOR = this._addCommonSpriteAttributes(new Meteor(this._game));
            }

            return this._mobs.METEOR;
        }


    }

}
