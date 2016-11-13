namespace Generator {
    export class Parameters {
        public static GRID : any = {
            HEIGHT: 24, // 1024/32
            CELL: {
                SIZE: 32,
                STEPS: 4
            },
            MIN_CELL: 0,
            MAX_CELL: 20
        };

        public static GRAVITY : number = 2400;

        public static PLAYER : any = {
            BODY: {
                WIDTH: 32,
                HEIGHT: 32
            }
        };


        public static VELOCITY : any = {
            X: 300
        };
    }
}