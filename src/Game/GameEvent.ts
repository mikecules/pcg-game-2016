namespace PCGGame {
    export const enum gameEventTypeEnum {MOB_KILLED = 1, MOB_TOOK_DAMAGE, MOB_RESPAWNED, MOB_RECIEVED_LOOT};

    export class GameEvent {
        public type : number;
        public payload : any;

        public constructor(type : number, payload : any){
            this.type = type;
            this.payload = payload;
        }
    }

}