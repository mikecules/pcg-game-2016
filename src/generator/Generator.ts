namespace Generator {
    export class Parameters {
        public static GRID : any = {
            HEIGHT: 10,
            CELL: {
                SIZE: 64,
                STEPS: 4
            }
        };

        public static GRAVITY : number = 2400;

        public static PLAYER : any = {
            BODY: {
                WIDTH: 30,
                HEIGHT: 90
            }
        };

        public static JUMP : any = {
            HEIGHT : {
                MIN: Parameters.GRID.CELL.SIZE * 0.75,
                MAX: Parameters.GRID.CELL.SIZE * 2.90,
                STEPS: Parameters.GRID.STEPS
            }
        };

        public static VELOCITY : any = {
            X: 300
        };

    }
}