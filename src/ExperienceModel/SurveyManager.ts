namespace PCGGame {
    export class SurveyManager {
        private _modal : Modal = null;

        public constructor(id: string) {
            this._modal = new Modal(id);
        }

        public showSurvey() {
            this._modal.open();
        }

        public get modalEvent() : Phaser.Signal {
            return this._modal.modalCompleteSignal;
        }

        public get isShowing() : boolean {
            return this._modal.isOpen;
        }

    }

    class Modal {

        private _isOpen : boolean = false;
        private _modalEl : JQuery = null;

        public modalCompleteSignal : Phaser.Signal = null;


        public constructor(id: string) {
            this._modalEl = $('#' + id);

            this._modalEl.on('show.bs.modal', () => {
                this._isOpen = true;
                this._dispatchEvent();
            } );

            this._modalEl.on('hidden.bs.modal', () => {
                this._isOpen = false;
                this._dispatchEvent();
            } );

            this.modalCompleteSignal = new Phaser.Signal();
        }

        public open(shouldOpen : boolean = true) {
            this._isOpen = shouldOpen || ! this._isOpen;
            this._modalEl.modal((this._isOpen ? 'show' : 'hide'));
        }

        public get isOpen() : boolean {
            return this._isOpen;
        }

        private _dispatchEvent() {
            this.modalCompleteSignal.dispatch({isOpen: this._isOpen, values: {}});
        }
    }
}