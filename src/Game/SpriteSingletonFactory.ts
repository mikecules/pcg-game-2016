/// <reference path="Sprite.ts" />

namespace PCGGame {

    export class SpriteSingletonFactory {

        public static _instance : SpriteSingletonFactory = null;

        private _game : Phaser.Game = null;
        private _mobs : any = {
            NOTCH: null,
            INVADER: null,
            METEOR: null,
            MEGAHEAD: null,
            NULL_MOB: null,
            PLATFORM_TYPE: null,
            PUSH_PLATFORM_TYPE: null
        };

        public constructor(game: Phaser.Game) {
            this._game = game;
        }


        private _addCommonSpriteAttributes(sprite : Sprite, shouldEnablePhysics = true) : Sprite {
            sprite.spriteFactoryParent = this;

            if (shouldEnablePhysics) {
                this._game.physics.enable(sprite, Phaser.Physics.ARCADE);
                //console.log('Sprite created: ', sprite);
                let body = <Phaser.Physics.Arcade.Body>sprite.body;

                body.allowGravity = false;
                body.immovable = false;
                body.moves = true;
                body.setSize(Generator.Parameters.GRID.CELL.SIZE, Generator.Parameters.GRID.CELL.SIZE, 0, 0);
            }

            //console.log(sprite);

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

        public getMegaHeadMob() {
            if (this._mobs.MEGAHEAD === null) {
                this._mobs.MEGAHEAD = this._addCommonSpriteAttributes(new MegaHead(this._game));
            }

            return this._mobs.MEGAHEAD;
        }


        public getMeteorMob() {
            if (this._mobs.METEOR === null) {
                this._mobs.METEOR = this._addCommonSpriteAttributes(new Meteor(this._game));
            }

            return this._mobs.METEOR;
        }

        public getNullMob() {
            if (this._mobs.NULL_MOB === null) {
                this._mobs.NULL_MOB = this._addCommonSpriteAttributes(new NullSprite(this._game), false);
            }

            return this._mobs.NULL_MOB;
        }

        public getPlatformMob() {
            if (this._mobs.PLATFORM_TYPE === null) {
                this._mobs.PLATFORM_TYPE = this._addCommonSpriteAttributes(new Platform(this._game));
            }

            return this._mobs.PLATFORM_TYPE;
        }

        public getPushPlatformMob() {
            if (this._mobs.PUSH_PLATFORM_TYPE === null) {
                this._mobs.PUSH_PLATFORM_TYPE = this._addCommonSpriteAttributes(new PushPlatform(this._game));
            }

            return this._mobs.PUSH_PLATFORM_TYPE;
        }


    }

}

