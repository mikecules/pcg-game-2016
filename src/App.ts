namespace PCGGame {
    export class Global {
        static game : Phaser.Game;


        static SCREEN : any = {
            WIDTH: 1024,
            HEIGHT: 640
        }
    }

}

window.onload = function() {
    PCGGame.Global.game = new PCGGame.Game();
}