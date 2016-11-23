namespace PCGGame {
    export class SurveyManager {
        private _modal : Modal = null;
        public currentPreferenceCondition : PreferenceCondition = null;


        public constructor(id: string) {
            this._modal = new Modal(id);

            this._modal.modalCompleteSignal.add((e : any) => {

                if (e.isOpen) {
                    return;
                }

                if (this.currentPreferenceCondition) {
                   let prefValIndex : number = parseInt($('input:radio[name=prefOption]:checked').val(), 10);

                   this.currentPreferenceCondition.preference = prefValIndex;
               }
            });
        }

        private setQuestion() {

            let questions : string[] = this.currentPreferenceCondition.questions;
            let questionsHTML : string = '';

            let isChecked : string = 'checked';

            for (let i = 0; i < questions.length; i++) {
                questionsHTML += `<div class="checkbox"><label><input type="radio" name="prefOption" value="${i}" ${isChecked}> ${questions[i]}</label></div>`;
                isChecked = '';
            }

            this._modal.body = `<div class="question-container">${questionsHTML}</div>`;
        }

        public showSurvey() {
            if (! this._modal.isOpen && this.currentPreferenceCondition) {
                this.setQuestion();
            }

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
        private _modalBodyEl : JQuery = null;

        public modalCompleteSignal : Phaser.Signal = null;


        public constructor(id: string) {
            this._modalEl = $('#' + id);
            this._modalBodyEl = this._modalEl.find('.modal-body');
            this._modalEl.modal({show: false, keyboard: false, backdrop: 'static'});

            this._modalEl.on('show.bs.modal', () => {
                this._isOpen = true;
                this._dispatchEvent();
            } );

            this._modalEl.on('hidden.bs.modal', () => {
                this._isOpen = false;
                this._dispatchEvent();
            } );

            this._modalEl.find('.btn-done').click(() => {
                this.open(false);
            });

            this.modalCompleteSignal = new Phaser.Signal();
        }

        public open(shouldOpen : boolean = true) {
            this._isOpen = shouldOpen || ! this._isOpen;
            this._modalEl.modal((this._isOpen ? 'show' : 'hide'));
        }

        public get isOpen() : boolean {
            return this._isOpen;
        }

        public set body(html : string) {
            this._modalBodyEl.html(html);
        }

        private _dispatchEvent() {
            this.modalCompleteSignal.dispatch({isOpen: this._isOpen, values: {}});
        }
    }
}