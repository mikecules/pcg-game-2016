namespace PCGGame {

    export class PreferenceCondition {
        public moreStrategy : Strategy = null;
        public lessStrategy : Strategy = null;
        public count : number = 0;
        private _questions : string[] = null;
        private _selectedPref : number = 0;

        public affectWord : string = '';
        public moreConditionPhrase : string = '';
        public lessConditionPhrase : string = '';

        public constructor(moreCondition: string, lessCondition : string, affectWord : string, moreStrategy : Strategy, lessStrategy : Strategy) {
            this.affectWord = affectWord;
            this.moreConditionPhrase = moreCondition;
            this.lessConditionPhrase = lessCondition;

            this.moreStrategy = moreStrategy;
            this.lessStrategy = lessStrategy;
        }

        public static capitalizeFirstLetter(str : string) : string {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        public get questions() : string[] {
            if (this._questions === null) {
                this._questions = [
                    PreferenceCondition.capitalizeFirstLetter(this.moreConditionPhrase) + ` are more <strong>${this.affectWord}</strong> than ${this.lessConditionPhrase}.`,
                    PreferenceCondition.capitalizeFirstLetter(this.lessConditionPhrase) + ` are more <strong>${this.affectWord}</strong> than ${this.moreConditionPhrase}.`,
                    `Both options sounds equally <strong>${this.affectWord}</strong>.`,
                    `Neither of the two options sounds <strong>${this.affectWord}</strong>.`
                ];
            }

            return this._questions;
        }

        public set questions(questions : string[]) {
            this._questions = questions;
        }

        public get isViable() {
            return (this.moreStrategy && this.lessStrategy) ? (this.moreStrategy.isViable && this.lessStrategy.isViable) : false;
        }

        public set preference(pref : number) {
            if (pref >= 0 && pref < this.questions.length) {
                this._selectedPref = pref;
                this.count++;

                switch (pref) {
                    case 1:
                        this.lessStrategy.strategyFunction();
                        break;
                    default:
                        this.moreStrategy.strategyFunction();
                        break;
                }
            }
        }

        public get preference() : number {
            return this._selectedPref;
        }

    }
}