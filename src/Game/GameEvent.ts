namespace PCGGame {
    export const enum gameEventTypeEnum {MOB_KILLED = 1, MOB_TOOK_DAMAGE, MOB_RESPAWNED};

    export class GameEvent {
        public type : number;
        public payload : any;

        public constructor(type : number, payload : any){
            this.type = type;
            this.payload = payload;
        }
    }

}