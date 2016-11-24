namespace Helper {

    export class Pool<T> {
        private _classType: any;
        private _newItemFunction: Function = null;
        private _itemCount: number = 0;
        private _pool: T[] = [];
        private _canGrow: boolean = true;
        private _poolSize: number = 0;

        constructor(classType: any, count: number, newItemFunction?: Function) {
            this._classType = classType;
            this._newItemFunction = newItemFunction;

            for (let i = 0; i < count; i++) {
                // store into stack of free items
                this._pool.push(this.newItem());
                this._itemCount++;
            }
        }


        // create an item and decrease the pool size
        public createItem(): T {
            if (this._itemCount === 0) {
                return this._canGrow ? this.newItem() : null;
            }
            else {
                return this._pool[--this._itemCount];
            }
        }

        // return an item to the pool to be reused later
        public destroyItem(item: T): void {
            this._pool[this._itemCount++] = item;
        }

        protected newItem(): T {

            let item : any = null;

            if (typeof this._newItemFunction === 'function') {
                item = this._newItemFunction();
            }
            else {
                item = new this._classType;
            }

            ++this._poolSize;

            return item;
        }

        public set newItemFunction(newFunction: Function) {
            this._newItemFunction = newFunction;
        }

        public set canGrow(canGrow: boolean) {
            this._canGrow = canGrow;
        }
    }

}