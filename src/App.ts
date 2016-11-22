/// <reference path="./../lib/jquery.d.ts" />
/// <reference path="./../lib/bootstrap.d.ts" />


namespace PCGGame {
    export class Global {
        public static game : Phaser.Game;


        public static SCREEN : any = {
            WIDTH: 1024,
            HEIGHT: 640
        }
    }

}

$(document).ready(() => {
    PCGGame.Global.game = new PCGGame.Game();

    if (PCGGame.ExperientialGameManager.IS_EXPERIENCE_MODEL_ENABLED) {
        $('#player-survey-instruction').removeClass('hidden');
    }
});