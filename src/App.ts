namespace PCGGame {
    export class Global {
        public static game : Phaser.Game;


        public static SCREEN : any = {
            WIDTH: 1024,
            HEIGHT: 640
        }
    }

}

window.onload = function() {
    PCGGame.Global.game = new PCGGame.Game();
}