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

        public static SPRITE : any = {
            WIDTH: 32,
            HEIGHT: 32,
            FRAMES: 10
        };

        public static PLAYER : any = {
            BODY: {
                WIDTH: 32,
                HEIGHT: 32
            }
        };


        // probability to generate random piece in percent
        public static GENERATE_BLOCK_THRESHOLD = 50;

        public static PLATFORM_BLOCKS : any = {
            MIN_LENGTH: 1,
            MAX_LENGTH: 5,
            MIN_DISTANCE: 1,
            MAX_DISTANCE: 10,
            NEW_PATTERN_REPEAT_LENGTH: 2,
            NEW_PATTERN_COMPOSITION_PERCENTAGE: 80
        };


        public static VELOCITY : any = {
            X: 300
        };
    }
}